import type { InspectResponse } from '@/proto/command/result/InspectResponse';

export interface InspectFormModel {
  className: string;
  methodNames: string[];
  times: number;
  minTime: number | null;
  includeTrace: boolean;
  includeStack: boolean;
  includeReturn: boolean;
}

export interface InspectLaunchAction {
  id: number;
  className: string;
  methodName: string;
}

export type InspectResult = InspectResponse;

export function createDefaultInspectForm(): InspectFormModel {
  return {
    className: '',
    methodNames: [],
    times: 10,
    minTime: null,
    includeTrace: false,
    includeStack: false,
    includeReturn: false
  };
}
