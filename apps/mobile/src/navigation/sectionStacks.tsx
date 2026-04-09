import { DrawerToggleButton } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { PhasePlaceholderParams } from "../screens/PhasePlaceholderScreen";
import { PhasePlaceholderScreen } from "../screens/PhasePlaceholderScreen";
import { ActivityEditorScreen } from "../screens/professor/ActivityEditorScreen";
import { ProfessorActivitiesListScreen } from "../screens/professor/ProfessorActivitiesListScreen";
import { ProfessorActivityDetailScreen } from "../screens/professor/ProfessorActivityDetailScreen";
import { ProfessorSubmissionReviewScreen } from "../screens/professor/ProfessorSubmissionReviewScreen";
import { StudentActivitiesListScreen } from "../screens/student/StudentActivitiesListScreen";
import { StudentActivityDetailScreen } from "../screens/student/StudentActivityDetailScreen";
import { StudentHomeScreen } from "../screens/StudentHomeScreen";
import { TeacherHomeScreen } from "../screens/TeacherHomeScreen";
import { stackScreenOptions } from "../theme";

const stackInsideDrawer = {
  ...stackScreenOptions,
  headerLeft: (props: Parameters<typeof DrawerToggleButton>[0]) => <DrawerToggleButton {...props} />,
};

const AlunoHomeNav = createNativeStackNavigator();
const AlunoTarefasNav = createNativeStackNavigator();
const AlunoConteudosNav = createNativeStackNavigator();
const AlunoCalendarioNav = createNativeStackNavigator();
const AlunoJogosNav = createNativeStackNavigator();
const AlunoComunidadeNav = createNativeStackNavigator();
const AlunoPerfilNav = createNativeStackNavigator();

const ProfHomeNav = createNativeStackNavigator();
const ProfTarefasNav = createNativeStackNavigator();
const ProfConteudosNav = createNativeStackNavigator();
const ProfCalendarioNav = createNativeStackNavigator();
const ProfComunidadeNav = createNativeStackNavigator();
const ProfPerfilNav = createNativeStackNavigator();

export function AlunoHomeStack() {
  return (
    <AlunoHomeNav.Navigator screenOptions={stackInsideDrawer}>
      <AlunoHomeNav.Screen name="AlunoHomeIndex" component={StudentHomeScreen} options={{ title: "Home" }} />
    </AlunoHomeNav.Navigator>
  );
}

function phaseParams(title: string, phase: number): PhasePlaceholderParams {
  return { title, phase };
}

export function AlunoTarefasStack() {
  return (
    <AlunoTarefasNav.Navigator screenOptions={stackInsideDrawer} initialRouteName="AlunoTarefasList">
      <AlunoTarefasNav.Screen
        name="AlunoTarefasList"
        component={StudentActivitiesListScreen}
        options={{ title: "Tarefas" }}
      />
      <AlunoTarefasNav.Screen
        name="AlunoTarefasDetail"
        component={StudentActivityDetailScreen}
        options={{ title: "Tarefa" }}
      />
    </AlunoTarefasNav.Navigator>
  );
}

export function AlunoConteudosStack() {
  return (
    <AlunoConteudosNav.Navigator screenOptions={stackInsideDrawer}>
      <AlunoConteudosNav.Screen
        name="AlunoConteudosIndex"
        component={PhasePlaceholderScreen}
        initialParams={phaseParams("Conteúdos", 3)}
        options={{ title: "Conteúdos" }}
      />
    </AlunoConteudosNav.Navigator>
  );
}

export function AlunoCalendarioStack() {
  return (
    <AlunoCalendarioNav.Navigator screenOptions={stackInsideDrawer}>
      <AlunoCalendarioNav.Screen
        name="AlunoCalendarioIndex"
        component={PhasePlaceholderScreen}
        initialParams={phaseParams("Calendário", 3)}
        options={{ title: "Calendário" }}
      />
    </AlunoCalendarioNav.Navigator>
  );
}

export function AlunoJogosStack() {
  return (
    <AlunoJogosNav.Navigator screenOptions={stackInsideDrawer}>
      <AlunoJogosNav.Screen
        name="AlunoJogosIndex"
        component={PhasePlaceholderScreen}
        initialParams={phaseParams("Jogos", 4)}
        options={{ title: "Jogos" }}
      />
    </AlunoJogosNav.Navigator>
  );
}

export function AlunoComunidadeStack() {
  return (
    <AlunoComunidadeNav.Navigator screenOptions={stackInsideDrawer}>
      <AlunoComunidadeNav.Screen
        name="AlunoComunidadeIndex"
        component={PhasePlaceholderScreen}
        initialParams={phaseParams("Comunidade", 4)}
        options={{ title: "Comunidade" }}
      />
    </AlunoComunidadeNav.Navigator>
  );
}

export function AlunoPerfilStack() {
  return (
    <AlunoPerfilNav.Navigator screenOptions={stackInsideDrawer}>
      <AlunoPerfilNav.Screen
        name="AlunoPerfilIndex"
        component={PhasePlaceholderScreen}
        initialParams={phaseParams("Perfil", 3)}
        options={{ title: "Perfil" }}
      />
    </AlunoPerfilNav.Navigator>
  );
}

export function ProfessorHomeStack() {
  return (
    <ProfHomeNav.Navigator screenOptions={stackInsideDrawer}>
      <ProfHomeNav.Screen
        name="ProfHomeIndex"
        component={TeacherHomeScreen}
        options={{ title: "Home" }}
      />
    </ProfHomeNav.Navigator>
  );
}

export function ProfessorTarefasStack() {
  return (
    <ProfTarefasNav.Navigator screenOptions={stackInsideDrawer} initialRouteName="ProfTarefasList">
      <ProfTarefasNav.Screen
        name="ProfTarefasList"
        component={ProfessorActivitiesListScreen}
        options={{ title: "Tarefas" }}
      />
      <ProfTarefasNav.Screen
        name="ProfTarefasNova"
        component={ActivityEditorScreen}
        options={{ title: "Nova tarefa" }}
      />
      <ProfTarefasNav.Screen
        name="ProfTarefasDetail"
        component={ProfessorActivityDetailScreen}
        options={{ title: "Tarefa" }}
      />
      <ProfTarefasNav.Screen
        name="ProfTarefasEditar"
        component={ActivityEditorScreen}
        options={{ title: "Editar tarefa" }}
      />
      <ProfTarefasNav.Screen
        name="ProfTarefasEnvio"
        component={ProfessorSubmissionReviewScreen}
        options={{ title: "Correção" }}
      />
    </ProfTarefasNav.Navigator>
  );
}

export function ProfessorConteudosStack() {
  return (
    <ProfConteudosNav.Navigator screenOptions={stackInsideDrawer}>
      <ProfConteudosNav.Screen
        name="ProfConteudosIndex"
        component={PhasePlaceholderScreen}
        initialParams={phaseParams("Conteúdos", 3)}
        options={{ title: "Conteúdos" }}
      />
    </ProfConteudosNav.Navigator>
  );
}

export function ProfessorCalendarioStack() {
  return (
    <ProfCalendarioNav.Navigator screenOptions={stackInsideDrawer}>
      <ProfCalendarioNav.Screen
        name="ProfCalendarioIndex"
        component={PhasePlaceholderScreen}
        initialParams={phaseParams("Calendário", 3)}
        options={{ title: "Calendário" }}
      />
    </ProfCalendarioNav.Navigator>
  );
}

export function ProfessorComunidadeStack() {
  return (
    <ProfComunidadeNav.Navigator screenOptions={stackInsideDrawer}>
      <ProfComunidadeNav.Screen
        name="ProfComunidadeIndex"
        component={PhasePlaceholderScreen}
        initialParams={phaseParams("Comunidade", 4)}
        options={{ title: "Comunidade" }}
      />
    </ProfComunidadeNav.Navigator>
  );
}

export function ProfessorPerfilStack() {
  return (
    <ProfPerfilNav.Navigator screenOptions={stackInsideDrawer}>
      <ProfPerfilNav.Screen
        name="ProfPerfilIndex"
        component={PhasePlaceholderScreen}
        initialParams={phaseParams("Perfil", 3)}
        options={{ title: "Perfil" }}
      />
    </ProfPerfilNav.Navigator>
  );
}
