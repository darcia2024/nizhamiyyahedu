"use client";
import { useEffect } from "react";
export function TrackCourseView({courseId}:{courseId:string}){
  useEffect(()=>{
    const key=`course-view:${courseId}`;
    try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,"1");}catch{/* Tracking is optional if storage is blocked. */}
    fetch("/api/events",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({courseId}),keepalive:true}).catch(()=>{});
  },[courseId]);
  return null;
}
