export function nextInterval(card, quality){
  const now = Date.now()
  let { interval=0, ease=2.5, reps=0 } = card
  if(quality < 3){
    reps = 0; interval = 1
  } else {
    ease = Math.max(1.3, ease + (0.1 - (5-quality)*(0.08 + (5-quality)*0.02)))
    if(reps === 0) interval = 1
    else if(reps === 1) interval = 6
    else interval = Math.round(interval * ease)
    reps += 1
  }
  return { interval, ease, reps, due: now + interval*86400000 }
} 