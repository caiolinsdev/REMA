export type AlunoTarefasStackParamList = {
  AlunoTarefasList: undefined;
  AlunoTarefasDetail: { activityId: string };
};

export type ProfTarefasStackParamList = {
  ProfTarefasList: undefined;
  ProfTarefasNova: undefined;
  ProfTarefasDetail: { activityId: string };
  ProfTarefasEditar: { activityId: string };
  ProfTarefasEnvio: { activityId: string; submissionId: string };
};
