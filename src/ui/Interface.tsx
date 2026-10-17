import { useEffect, useState } from 'react'
import { text } from '../game/content'
import { useGame } from '../game/store'
export function Interface({target}:{target:string|null}) { const s=useGame(),[code,setCode]=useState(''),[wrong,setWrong]=useState(false)
 useEffect(()=>{if(s.modal&&document.pointerLockElement)document.exitPointerLock()},[s.modal])
 useEffect(()=>{const e=(ev:KeyboardEvent)=>{if(ev.code==='KeyI'){s.setModal(s.modal==='inventory'?null:'inventory')} if(ev.code==='KeyE'&&!s.modal&&target){if(target==='ticket'&&!s.ticketCollected)s.setModal('ticket');if(target==='seat')s.readSeat();if(target==='box')s.discoverBox();if(target==='key'&&s.boxUnlocked&&!s.cinemaKeyCollected)s.collectKey();if(target==='door'){if(s.cinemaKeyCollected)s.unlockDoor();else s.setNotice(text.doorLocked)}}};window.addEventListener('keydown',e);return()=>window.removeEventListener('keydown',e)},[target,s])
 useEffect(()=>{if(!s.notice)return;const t=setTimeout(()=>s.setNotice(''),2200);return()=>clearTimeout(t)},[s.notice])
 const prompt=target==='ticket'?text.ticketPrompt:target==='seat'?'[E] B12 좌석 조사하기':target==='box'?text.boxPrompt:target==='key'?text.keyPrompt:target==='door'?(s.cinemaKeyCollected?text.doorPrompt:'[E] 문 조사하기'):''
 return <div className="hud"><div className="floor">2F CINEMA</div><div className="keys">MEMORY KEY {s.cinemaKeyCollected?'1':'0'}/3</div><div className="crosshair">+</div>{prompt&& !s.modal&&<div className="prompt">{prompt}</div>}<div className="task">{text.task}<span>WASD 이동 · Shift 달리기 · E 조사 · I 가방</span></div>{s.notice&&<div className="notice">{s.notice}</div>}
 {s.modal==='ticket'&&<Modal title="영화표"><article className="ticket"><b>{text.ticketTitle}</b><hr/><p>{text.ticketSeat}</p><p>{text.ticketDate}</p></article><button onClick={s.collectTicket}>보관하기</button></Modal>}
 {s.modal==='box'&&<Modal title="B12 · WOODEN BOX"><p>영화표에 남겨진 날짜를 입력하세요.</p><form onSubmit={e=>{e.preventDefault();code==='0812'?s.unlockBox():setWrong(true)}}><input aria-label="password" autoFocus inputMode="numeric" value={code} maxLength={4} onChange={e=>{setCode(e.target.value.replace(/\D/g,''));setWrong(false)}}/><button type="submit">Enter · 잠금 해제</button></form>{wrong&&<p className="error">비밀번호가 일치하지 않습니다.</p>}</Modal>}
 {s.modal==='inventory'&&<Modal title="INVENTORY"><div className="items">{s.ticketCollected?<button onClick={()=>s.setModal('ticket')}>OLD CINEMA TICKET<br/><small>B12 · 08.12</small></button>:<span>비어 있음</span>}{s.cinemaKeyCollected&&<button>CINEMA MEMORY KEY</button>}</div></Modal>}
 {s.modal==='complete'&&<Modal title="2F CINEMA COMPLETE"><p>잊혀진 영화관의 기억이 복원되었습니다.</p><p>Cinema Memory Key 획득 완료</p><button onClick={()=>s.setModal('next')}>다음 공간으로</button></Modal>}
 {s.modal==='next'&&<Modal title="3F · SCAR"><p>다음 기억의 층은 준비 중입니다.</p></Modal>}
 {s.modal&&s.modal!=='complete'&&s.modal!=='next'&&<button className="close" onClick={()=>s.setModal(null)}>닫기</button>}
 </div> }
function Modal({title,children}:{title:string;children:React.ReactNode}){return <div className="modal-backdrop"><section className="modal"><h2>{title}</h2>{children}</section></div>}
