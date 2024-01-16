export const convertSecondsToFrames = (seconds: number, videoFramerate : number): number => {
  return Math.floor(seconds * videoFramerate);
}

export const convertFramesToSeconds = (frames: number, videoFramerate : number): number => {
  return frames / videoFramerate;
}