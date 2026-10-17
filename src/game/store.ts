import { create } from 'zustand'
import { emitGameEvent } from './events'
export type Modal = 'ticket' | 'box' | 'inventory' | 'complete' | 'next' | null
type State = { ticketCollected:boolean; seatClueRead:boolean; boxDiscovered:boolean; boxUnlocked:boolean; cinemaKeyCollected:boolean; exitDoorUnlocked:boolean; floor2Completed:boolean; modal:Modal; notice:string; collectTicket:()=>void; readSeat:()=>void; discoverBox:()=>void; unlockBox:()=>void; collectKey:()=>void; unlockDoor:()=>void; setModal:(m:Modal)=>void; setNotice:(n:string)=>void; reset:()=>void }
const defaults = { ticketCollected:false, seatClueRead:false, boxDiscovered:false, boxUnlocked:false, cinemaKeyCollected:false, exitDoorUnlocked:false, floor2Completed:false }
export const useGame = create<State>((set) => ({ ...defaults, modal:null, notice:'',
  collectTicket:()=>{set({ticketCollected:true,modal:null,notice:'영화표를 보관했습니다.'});emitGameEvent('ticket_collected')},
  readSeat:()=>set({seatClueRead:true,notice:'B12 좌석을 찾았습니다.'}), discoverBox:()=>set({boxDiscovered:true,modal:'box'}),
  unlockBox:()=>{set({boxUnlocked:true,modal:null,notice:'잠금이 해제되었습니다.'});emitGameEvent('box_unlocked')},
  collectKey:()=>{set({cinemaKeyCollected:true,modal:null,notice:'Cinema Memory Key 획득'});emitGameEvent('cinema_key_collected');emitGameEvent('cinema_memory_restored')},
  unlockDoor:()=>{set({exitDoorUnlocked:true,floor2Completed:true,modal:'complete'});emitGameEvent('floor2_completed')},
  setModal:(modal)=>set({modal}), setNotice:(notice)=>set({notice}), reset:()=>set({...defaults,modal:null,notice:''})
}))
