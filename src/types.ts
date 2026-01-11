export type WFSLRepoGuardSchemaId = "wfsl.repo-guard.v1";

export type WFSLRepoGuardMode = "repo" | "marketplace";

export type WFSLRepoGuardOutcome = "ADMITTED" | "REFUSED" | "ERROR";

export type WFSLRepoGuardCode =
  | "REPO_ADMITTED"
  | "FORBIDDEN_ARTIFACT_PRESENT"
  | "REQUIRED_FILE_MISSING"
  | "INVALID_RELEASE_SEQUENCE"
  | "MARKETPLACE_CONTRACT_VIOLATION"
  | "CHECK_FAILED";

export type WFSLRepoGuardFinding = {
  code: WFSLRepoGuardCode;
  message: string;
  paths?: string[];
  missing?: string[];
  details?: Record<string, unknown>;
};

export type WFSLRepoGuardEvidence = {
  schema: WFSLRepoGuardSchemaId;
  run_id: string;
  timestamp: string;
  root: string;
  mode: WFSLRepoGuardMode;
  outcome: WFSLRepoGuardOutcome;
  exit_code: number;
  findings: WFSLRepoGuardFinding[];
};

export type WFSLRepoGuardConfigV1 = {
  schema: WFSLRepoGuardSchemaId;
  version: string;
  posture: "deny";
  mode_defaults?: {
    repo?: {
      require_files?: string[];
      forbid_paths?: string[];
    };
    marketplace?: {
      require_files?: string[];
      forbid_paths?: string[];
      require_action_yml?: boolean;
      require_tags?: boolean;
    };
  };
};
