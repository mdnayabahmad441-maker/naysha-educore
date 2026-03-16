import { getAll, createItem } from "./base.service"

export function getTeachers(){
  return getAll("teachers")
}

export function createTeacher(data:any){
  return createItem("teachers",data)
}