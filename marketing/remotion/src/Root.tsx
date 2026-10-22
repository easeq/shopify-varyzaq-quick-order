import React from "react";
import { Composition } from "remotion";
import { VariantQuickOrderPromo } from "./VariantQuickOrderPromo";
export const RemotionRoot: React.FC = () => (
  <Composition
    id="VariantQuickOrderPromo"
    component={VariantQuickOrderPromo}
    durationInFrames={1080}
    fps={30}
    width={1920}
    height={1080}
  />
);
