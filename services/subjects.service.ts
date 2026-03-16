import { getAll, createItem } from "./base.service"

export function getSubjects(){
  return getAll("subjects")
}

export function createSubject(data:any){
  return createItem("subjects",data)
}