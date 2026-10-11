import { clamp, smooth } from './story';

// The mask and the outgoing descent share an interval: no floor-level hold.
export const openingCut = { start:.075, end:.18 } as const;
export const footerCut = { start:.87, end:.92 } as const;

/** Home uses forward uScroll; Footer uses 1-progress. Times are adapted to our page. */
export const spaceTimeline = (p:number) => {
  const footer=p>=footerCut.start;
  const enter=smooth(0,openingCut.start,p),leave=smooth(footerCut.start,1,p);
  const descent=1.8*smooth(openingCut.start,openingCut.end,p);
  return {
    footer,
    // Source ParticleTest funnel + scrollMove run in opposite directions at the two ends.
    scroll:footer?1-leave:enter,
    cameraY:footer?.64-18*leave:.64+16*(1-enter)-descent,
    logoY:footer?-18*leave:16*(1-enter)-descent,
    rotation:footer?(130-180*(1-clamp((p-footerCut.start)/(1-footerCut.start))))*Math.PI/180:(70-190*smooth(0,openingCut.end,p))*Math.PI/180,
    logoPresence:footer?1-.94*smooth(.97,1,p):.25+.75*smooth(0,.035,p),
  };
};
