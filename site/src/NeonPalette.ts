/** Continuous world-space light fields: cyan → electric blue → violet → magenta.
 * The cloud's source RGB is used for luminance only, so green vegetation cannot leak into the palette.
 */
export const neonPalette = `
vec3 neonPalette(vec3 p){
  float field=clamp(.5+p.x*.10+p.y*.024+sin(p.y*.64+p.z*.7)*.12,0.,1.);
  vec3 cyan=vec3(.025,.72,1.15),blue=vec3(.035,.12,.88),violet=vec3(.43,.055,.82),pink=vec3(1.05,.065,.51);
  vec3 col=mix(cyan,blue,smoothstep(.28,.50,field));
  col=mix(col,violet,smoothstep(.43,.60,field));
  col=mix(col,pink,smoothstep(.54,.72,field));
  float warm=smoothstep(.89,.995,.5+.5*sin(p.y*.93+p.x*.61+p.z*.8));
  return mix(col,vec3(1.05,.52,.18),warm*.32);
}
vec3 softLight(vec3 base,vec3 blend){
  vec3 low=2.*base*blend+base*base*(1.-2.*blend);
  vec3 high=sqrt(max(base,vec3(0.)))*(2.*blend-1.)+2.*base*(1.-blend);
  return mix(low,high,step(vec3(.5),blend));
}
vec2 rotateSprite(vec2 uv,float angle){vec2 q=uv-.5;float c=cos(angle),s=sin(angle);return mat2(c,-s,s,c)*q+.5;}
`;
