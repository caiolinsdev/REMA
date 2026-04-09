import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
  type DrawerContentComponentProps,
} from "@react-navigation/drawer";

import { theme } from "../theme";
import { useAuth } from "../context/AuthContext";
import {
  AlunoCalendarioStack,
  AlunoComunidadeStack,
  AlunoConteudosStack,
  AlunoHomeStack,
  AlunoJogosStack,
  AlunoPerfilStack,
  AlunoTarefasStack,
  ProfessorCalendarioStack,
  ProfessorComunidadeStack,
  ProfessorConteudosStack,
  ProfessorHomeStack,
  ProfessorPerfilStack,
  ProfessorTarefasStack,
} from "./sectionStacks";

const Drawer = createDrawerNavigator();

function DrawerContent(props: DrawerContentComponentProps) {
  const { signOut } = useAuth();
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem label="Sair" onPress={() => void signOut()} />
    </DrawerContentScrollView>
  );
}

export function MainDrawer() {
  const { user } = useAuth();
  const isAluno = user?.role === "aluno";

  if (isAluno) {
    return (
      <Drawer.Navigator
        drawerContent={(p) => <DrawerContent {...p} />}
        screenOptions={{
          drawerActiveTintColor: theme.colors.primary,
          headerShown: false,
        }}
      >
        <Drawer.Screen name="AlunoHome" component={AlunoHomeStack} options={{ title: "Home", drawerLabel: "Home" }} />
        <Drawer.Screen
          name="AlunoTarefas"
          component={AlunoTarefasStack}
          options={{ title: "Tarefas", drawerLabel: "Tarefas" }}
        />
        <Drawer.Screen
          name="AlunoConteudos"
          component={AlunoConteudosStack}
          options={{ title: "Conteúdos", drawerLabel: "Conteúdos" }}
        />
        <Drawer.Screen
          name="AlunoCalendario"
          component={AlunoCalendarioStack}
          options={{ title: "Calendário", drawerLabel: "Calendário" }}
        />
        <Drawer.Screen name="AlunoJogos" component={AlunoJogosStack} options={{ title: "Jogos", drawerLabel: "Jogos" }} />
        <Drawer.Screen
          name="AlunoComunidade"
          component={AlunoComunidadeStack}
          options={{ title: "Comunidade", drawerLabel: "Comunidade" }}
        />
        <Drawer.Screen name="AlunoPerfil" component={AlunoPerfilStack} options={{ title: "Perfil", drawerLabel: "Perfil" }} />
      </Drawer.Navigator>
    );
  }

  return (
    <Drawer.Navigator
      drawerContent={(p) => <DrawerContent {...p} />}
      screenOptions={{
        drawerActiveTintColor: theme.colors.primary,
        headerShown: false,
      }}
    >
      <Drawer.Screen name="ProfHome" component={ProfessorHomeStack} options={{ title: "Home", drawerLabel: "Home" }} />
      <Drawer.Screen
        name="ProfTarefas"
        component={ProfessorTarefasStack}
        options={{ title: "Tarefas", drawerLabel: "Tarefas" }}
      />
      <Drawer.Screen
        name="ProfConteudos"
        component={ProfessorConteudosStack}
        options={{ title: "Conteúdos", drawerLabel: "Conteúdos" }}
      />
      <Drawer.Screen
        name="ProfCalendario"
        component={ProfessorCalendarioStack}
        options={{ title: "Calendário", drawerLabel: "Calendário" }}
      />
      <Drawer.Screen
        name="ProfComunidade"
        component={ProfessorComunidadeStack}
        options={{ title: "Comunidade", drawerLabel: "Comunidade" }}
      />
      <Drawer.Screen name="ProfPerfil" component={ProfessorPerfilStack} options={{ title: "Perfil", drawerLabel: "Perfil" }} />
    </Drawer.Navigator>
  );
}
