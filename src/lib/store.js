import { set, get } from 'idb-keyval'
export async function saveProgress(key, data){ await set(key, data) }
export async function loadProgress(key){ return (await get(key))||{} } 