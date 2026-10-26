"use client";
import { useActionState, useState, startTransition } from "react";
import { reorderLessons } from "@/app/actions/manage";
import { idle } from "@/lib/action";
export function LessonSort({courseId,lessons}:{courseId:string;lessons:{id:string;title:string}[]}){
  const [dragged,setDragged]=useState<string|null>(null);
  const [state,dispatch,pending]=useActionState(reorderLessons,idle);
  const drop=(target:string)=>{if(!dragged||dragged===target||pending)return;const ids=lessons.map(l=>l.id);const from=ids.indexOf(dragged),to=ids.indexOf(target);ids.splice(from,1);ids.splice(to,0,dragged);const fd=new FormData();fd.set("courseId",courseId);fd.set("ids",JSON.stringify(ids));startTransition(()=>dispatch(fd));setDragged(null);};
  return <details className="pad"><summary>Urutkan dengan seret dan lepas</summary><p className="small muted">Seret judul ke posisi baru. Untuk keyboard atau HP, gunakan tombol Naikkan dan Turunkan pada tabel.</p><ol className="sort-list">{lessons.map((l,i)=><li key={l.id} draggable={!pending} onDragStart={()=>setDragged(l.id)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();drop(l.id);}}><span aria-hidden="true">{i+1}</span>{l.title}</li>)}</ol>{pending&&<p role="status">Menyimpan urutan...</p>}{state.ok&&state.message&&<p role="status">{state.message}</p>}{!state.ok&&<p className="err" role="alert">{state.error}</p>}</details>;
}
