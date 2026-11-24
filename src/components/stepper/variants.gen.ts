// Generated from manifest.json by scripts/build-manifests.mjs. Do not edit.
export const stepperOrientations = ["horizontal","vertical"] as const;
export type StepperOrientation = (typeof stepperOrientations)[number];
export const stepperStates = ["complete","current","upcoming"] as const;
export type StepperState = (typeof stepperStates)[number];
