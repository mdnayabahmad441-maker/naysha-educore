import { getAll, createItem } from "./base.service"

export function getClasses(){
  return getAll("classes")
}

export function createClass(data:any){
  return createItem("classes",data)
}