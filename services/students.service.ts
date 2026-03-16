import { getAll, createItem } from "./base.service"

export function getStudents(){
  return getAll("students")
}

export function createStudent(data:any){
  return createItem("students",data)
}