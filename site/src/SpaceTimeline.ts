import { clamp, smooth } from './story';

/** Home uses forward uScroll; Footer uses 1-progress. Times are adapted to our page. */
export const spaceTimeline = (p:number) => {
  const footer=p>=.87;
  const enter=smooth(0,.075,p),leave=smooth(.935,1,p);
  const descent=1.8*smooth(.075,.18,p);
  return {
    footer,
    // Source ParticleTest funnel + scrollMove run in opposite directions at the two ends.
    scroll:footer?1-leave:enter,
    cameraY:footer?.64-18*leave:.64+16*(1-enter)-descent,
    logoY:footer?-18*leave:16*(1-enter)-descent,
    rotation:footer?(130-180*(1-clamp((p-.87)/.13)))*Math.PI/180:(70-190*smooth(0,.20,p))*Math.PI/180,
    logoPresence:footer?1-.94*smooth(.97,1,p):.25+.75*smooth(0,.035,p),
  };
};
