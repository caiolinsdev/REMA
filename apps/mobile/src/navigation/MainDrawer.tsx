import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
  type DrawerContentComponentProps,
} from "@react-navigation/drawer";

import { useAuth } from "../context/AuthContext";
import { PlaceholderScreen } from "../screens/PlaceholderScreen";

const Drawer = createDrawerNavigator();

const alunoScreens: { name: string; title: string; subtitle?: string }[] = [
  { name: "AlunoHome", title: "Home", subtitle: "Resumo (waves seguintes)." },
  { name: "AlunoAtividades", title: "Provas / atividades / trabalhos", subtitle: "Wave 2+." },
  { name: "AlunoConteudos", title: "Conteudos", subtitle: "Wave 4." },
  { name: "AlunoCalendario", title: "Calendario", subtitle: "Wave 4." },
  { name: "AlunoJogos", title: "Jogos", subtitle: "Wave 6." },
  { name: "AlunoComunidade", title: "Comunidade", subtitle: "Wave 5." },
  { name: "AlunoPerfil", title: "Perfil", subtitle: "Wave 5." },
];

const professorScreens: { name: string; title: string; subtitle?: string }[] = [
  { name: "ProfHome", title: "Home", subtitle: "Resumo (waves seguintes)." },
  { name: "ProfAtividades", title: "Provas / atividades / trabalhos", subtitle: "Wave 2+." },
  { name: "ProfConteudos", title: "Conteudos", subtitle: "Wave 4." },
  { name: "ProfCalendario", title: "Calendario", subtitle: "Wave 4." },
  { name: "ProfComunidade", title: "Comunidade", subtitle: "Wave 5." },
  { name: "ProfPerfil", title: "Perfil", subtitle: "Wave 5." },
];

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
  const screens = isAluno ? alunoScreens : professorScreens;

  return (
    <Drawer.Navigator
      drawerContent={(p) => <DrawerContent {...p} />}
      screenOptions={{
        drawerActiveTintColor: "#2563eb",
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#f8fafc",
      }}
    >
      {screens.map((s) => (
        <Drawer.Screen
          key={s.name}
          name={s.name}
          options={{ title: s.title, drawerLabel: s.title }}
        >
          {() => <PlaceholderScreen title={s.title} subtitle={s.subtitle} />}
        </Drawer.Screen>
      ))}
    </Drawer.Navigator>
  );
}
