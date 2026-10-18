import * as T from "three";
export type Surface =
  "concrete" | "floor" | "velvet" | "rust" | "paper" | "wood";
const cache = new Map<string, T.MeshPhysicalMaterial>();
function hash(x: number, y: number) {
  let v = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  v = Math.imul(v ^ (v >>> 13), 1274126177);
  return ((v ^ (v >>> 16)) >>> 0) / 4294967295;
}
function noise(x: number, y: number) {
  const ix = Math.floor(x),
    iy = Math.floor(y);
  let fx = x - ix,
    fy = y - iy;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  return (
    (hash(ix, iy) * (1 - fx) + hash(ix + 1, iy) * fx) * (1 - fy) +
    (hash(ix, iy + 1) * (1 - fx) + hash(ix + 1, iy + 1) * fx) * fy
  );
}
export function random(seed: number) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}
// Original procedural PBR textures; no external downloads, no photographic billboard.
// Height is differentiated into a tangent-space normal map, independently of base colour.
export function material(kind: Surface, repeatX = 1, repeatY = 1) {
  const key = `${kind}:${repeatX}:${repeatY}`;
  if (cache.has(key)) return cache.get(key)!;
  const n = 512,
    rng = random(31),
    height = new Float32Array(n * n),
    base = new Uint8Array(n * n * 4),
    rough = new Uint8Array(n * n * 4);
  const centers = Array.from({ length: 22 }, () => [
    rng() * n,
    rng() * n,
    2 + rng() * 7,
  ]);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const i = y * n + x,
        grain = rng(),
        cloud =
          (noise(x / 94, y / 94) - 0.5) * 0.26 +
          (noise(x / 27, y / 27) - 0.5) * 0.15 +
          (noise(x / 8, y / 8) - 0.5) * 0.08;
      let h = grain * 0.018 + cloud * 0.08,
        stain = 0;
      if (kind === "concrete") {
        // Vertical leaks, mould at wall foot, and centimetre-scale chipped craters.
        stain =
          Math.max(0, noise(x / 13, 3) - 0.65) *
          1.1 *
          (0.3 + 0.7 * noise(x / 40, y / 240));
        stain +=
          Math.max(0, (y / n - 0.82) * 2.1) *
          (noise(x / 18, y / 12) * 0.8 + 0.15);
        for (const [cx, cy, rad] of centers) {
          const d = Math.hypot(x - cx, y - cy) / rad;
          if (d < 1.35) {
            h += d < 0.65 ? -0.65 : (1.35 - d) * 0.35;
            stain += d < 0.65 ? 0.5 : 0.08;
          }
        }
      }
      if (kind === "floor") {
        const crack = Math.abs(noise(x / 95, y / 95) - 0.47);
        if (crack < 0.0025 && noise(x / 170 + 4, y / 170) > 0.5) {
          h -= 0.12;
          stain = 0.43;
        }
      }
      if (kind === "velvet") {
        h =
          Math.sin(x * 1.8) * 0.008 + Math.sin(y * 2.1) * 0.008 + grain * 0.008;
        stain = Math.max(0, cloud) * 1.3;
      }
      if (kind === "wood") {
        h = Math.sin(x * 0.19 + Math.sin(y * 0.012) * 2) * 0.12 + grain * 0.05;
        stain = h + 0.12;
      }
      const rusty = noise(x / 36 + 10, y / 36) > 0.58;
      const palette =
        kind === "velvet"
          ? [88, 39, 35]
          : kind === "rust"
            ? rusty
              ? [99, 57, 30]
              : [91, 94, 87]
            : kind === "paper"
              ? [188, 173, 140]
              : kind === "wood"
                ? [83, 63, 44]
                : [137, 132, 119];
      const factor = 0.86 + cloud + grain * 0.08 - stain;
      for (let c = 0; c < 3; c++)
        base[i * 4 + c] = Math.max(9, palette[c] * factor);
      base[i * 4 + 3] = 255;
      height[i] = h;
      rough[i * 4] =
        rough[i * 4 + 1] =
        rough[i * 4 + 2] =
          Math.min(255, kind === "rust" ? 130 + grain * 100 : 185 + grain * 60);
      rough[i * 4 + 3] = 255;
    }
  const normal = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const i = y * n + x,
        dx =
          (height[y * n + ((x + 1) % n)] - height[y * n + ((x + n - 1) % n)]) *
          2,
        dy =
          (height[((y + 1) % n) * n + x] - height[((y + n - 1) % n) * n + x]) *
          2,
        v = new T.Vector3(-dx, -dy, 1).normalize();
      normal.set(
        [
          (v.x * 0.5 + 0.5) * 255,
          (v.y * 0.5 + 0.5) * 255,
          (v.z * 0.5 + 0.5) * 255,
          255,
        ],
        i * 4,
      );
    }
  const texture = (data: Uint8Array, srgb = false) => {
    const t = new T.DataTexture(data, n, n, T.RGBAFormat);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(repeatX, repeatY);
    t.magFilter = T.LinearFilter;
    t.minFilter = T.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = 4;
    if (srgb) t.colorSpace = T.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  };
  const mat = new T.MeshPhysicalMaterial({
    map: texture(base, true),
    normalMap: texture(normal),
    roughnessMap: texture(rough),
    roughness: kind === "velvet" ? 0.8 : 0.98,
    metalness: kind === "rust" ? 0.45 : 0,
    normalScale: new T.Vector2(0.7, 0.7),
    side: T.DoubleSide,
  });
  if (kind === "velvet") {
    mat.sheen = 1;
    mat.sheenColor = new T.Color("#b19b8a");
    mat.sheenRoughness = 0.72;
  }
  cache.set(key, mat);
  return mat;
}
export function featuredVelvet() {
  const mat = material("velvet").clone();
  mat.roughness = 0.2;
  mat.anisotropy = 0.85;
  mat.anisotropyRotation = 0.4;
  mat.sheenColor = new T.Color("#fff1da");
  mat.sheenRoughness = 0.4;
  // Beam-dependent fibre highlight, driven by world-space light position and intensity.
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.memoryLight = { value: new T.Vector3(-13, 8, 4) };
    shader.uniforms.memoryStrength = { value: 1 };
    shader.vertexShader = "varying vec3 memoryWorld;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <worldpos_vertex>",
      "#include <worldpos_vertex>\nmemoryWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;",
    );
    shader.fragmentShader =
      "varying vec3 memoryWorld; uniform vec3 memoryLight; uniform float memoryStrength;\n" +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      `vec3 beamAxis=normalize(vec3(-4.0,0.7,2.0)-memoryLight);
     vec3 toSurface=memoryWorld-memoryLight;
     float along=dot(toSurface,beamAxis);
     float radial=length(toSurface-beamAxis*along);
     float beam=exp(-radial*radial*1.8)*memoryStrength/(1.0+along*along*0.002);
     float fibre=pow(1.0-abs(dot(normal,geometryViewDir)),2.0);
     float band=exp(-pow((memoryWorld.y-0.95)*9.0,2.0));
     outgoingLight+=vec3(0.9,0.85,0.74)*beam*(0.025+fibre*band*0.55);
     #include <opaque_fragment>`,
    );
  };
  mat.customProgramCacheKey = () => "memory-fibre-v1";
  return mat;
}
