const { error } =
await supabase.storage
.from("school-logos")
.upload(fileName,file)