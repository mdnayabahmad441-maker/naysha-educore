import bcrypt from "bcryptjs"

export async function hashPin(pin:string){
  return await bcrypt.hash(pin,10)
}

export async function verifyPin(pin:string, hash:string){
  return await bcrypt.compare(pin,hash)
}