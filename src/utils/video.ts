export const convertSecondsToFrames = (seconds: number, videoFramerate : number): number => {
  return Math.floor(seconds * videoFramerate);
}

export const convertFramesToSeconds = (frames: number, videoFramerate : number): number => {
  return frames / videoFramerate;
}

export const convertHoursMinutesSecondsToSeconds = (hours: number, minutes: number, seconds: number): number => {
  return hours * 3600 + minutes * 60 + seconds;
}

export const convertSecondsToHoursMinutesSeconds = (seconds: number): [number, number, number] => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds - hours * 3600) / 60)
  const secondsLeft = seconds - hours * 3600 - minutes * 60

  return [hours, minutes, secondsLeft]
}