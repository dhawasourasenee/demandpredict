declare module "react-open-doodles" {
  import type { CSSProperties, FC } from "react";

  type DoodleProps = {
    ink?: string;
    accent?: string;
    style?: CSSProperties;
    className?: string;
  };

  export const PlantDoodle: FC<DoodleProps>;
  export const LovingDoodle: FC<DoodleProps>;
  export const ReadingDoodle: FC<DoodleProps>;
  export const FloatDoodle: FC<DoodleProps>;
  export const MeditatingDoodle: FC<DoodleProps>;
  export const CoffeeDoodle: FC<DoodleProps>;
  export const IceCreamDoodle: FC<DoodleProps>;
  export const SittingReadingDoodle: FC<DoodleProps>;
  export const GroovyDoodle: FC<DoodleProps>;
  export const ChillingDoodle: FC<DoodleProps>;
}
