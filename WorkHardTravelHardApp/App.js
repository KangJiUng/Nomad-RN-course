import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { theme } from "./colors";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons"; // @expo/vector-icons 사용 불가 -> Ionicons 사용으로 변경

const STORAGE_KEY = "@toDos";
const WORKING_KEY = "@working"; // 새로고침 후 불러올 버튼 상태 저장 키

export default function App() {
  const [working, setWorking] = useState(true);
  const [text, setText] = useState("");
  const [toDos, setToDos] = useState({});

  useEffect(() => {
    loadToDos();
    loadWorkingState(); // 버튼 상태 복원
  }, []);

  // 선택한 버튼 상태를 AsyncStorage에 저장
  const saveWorkingState = async (state) => {
    await AsyncStorage.setItem(WORKING_KEY, JSON.stringify(state));
  };

  // AsyncStorage에서 버튼 상태 불러오기
  const loadWorkingState = async () => {
    const savedState = await AsyncStorage.getItem(WORKING_KEY);
    if (savedState !== null) {
      setWorking(JSON.parse(savedState)); // boolean 값 복원
    }
  };

  const travel = () => {
    setWorking(false);
    saveWorkingState(false);
  };

  const work = () => {
    setWorking(true);
    saveWorkingState(true);
  };

  const onChangeText = (payload) => setText(payload);

  const saveToDos = async (toSave) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  };

  const loadToDos = async () => {
    const s = await AsyncStorage.getItem(STORAGE_KEY);
    setToDos(s ? JSON.parse(s) : {}); // null이면 빈 객체로 설정(강의에서 null 설정 안 해줌)
  };

  const addTodo = async () => {
    if (text === "") {
      return;
    }

    // state 수정 직접 절대 안됨. 객체 추가해주는 식으로 해줘야 할 것을 명심
    // Object.assign 써서 빈 객체+새로운 객체 해도 되지만 ES6 써도 됨(...toDos)
    const newToDos = { ...toDos, [Date.now()]: { text, working } };

    setToDos(newToDos);
    await saveToDos(newToDos);
    setText("");
  };

  const deleteTodo = async (key) => {
    Alert.alert("Delete To Do", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "I'm sure",
        style: "destructive", // 아이폰에서만 가능한 설정
        onPress: () => {
          const newToDos = { ...toDos }; // state의 내용으로 새 객체 생성
          delete newToDos[key]; // 이 객체는 아직 state에 없어서 mutate 해도 되지만 state는 절대 mutate 불가
          setToDos(newToDos); // state 업데이트
          saveToDos(newToDos);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        {
          // TouchableOpacity: 버튼을 클릭하면 투명도를 주는 컴포넌트(activeOpacity로 투명도 조절 가능)
          // TouchableHighlight: TouchableOpacity보다 좀 더 다양한 속성을 설정할 수 있음(ex-<TouchableHighlight onPress={() => console.log("pressed")}>)
          // TouchableWithoutFeedback: UI 변화없이 화면 위의 이벤트를 Listen할 때 사용
          // Pressable: Touchable 보다도 더 다양한 설정을 가지고 미래지향적임
        }
        <TouchableOpacity onPress={work}>
          <Text
            style={{ ...styles.btnText, color: working ? "white" : theme.grey }}
          >
            Work
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={travel}>
          <Text
            style={{
              ...styles.btnText,
              color: !working ? "white" : theme.grey,
            }}
          >
            Travel
          </Text>
        </TouchableOpacity>
      </View>
      {
        // TextInput: keyboardType이나 returntextType, multiline 등 설정 props도 다양하게 존재
      }
      <TextInput
        onSubmitEditing={addTodo}
        onChangeText={onChangeText}
        returnKeyType="done"
        value={text}
        placeholder={working ? "Add a To Do" : "Where do you want to go?"}
        style={styles.input}
      />
      <ScrollView>
        {Object.keys(toDos).map((key) =>
          toDos[key].working === working ? (
            <View style={styles.toDo} key={key}>
              <Text style={styles.toDoText}>{toDos[key].text}</Text>
              <TouchableOpacity onPress={() => deleteTodo(key)}>
                <Icon name="trash-outline" size={20} color="theme.grey" />
              </TouchableOpacity>
            </View>
          ) : null
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal: 20,
  },
  header: {
    justifyContent: "space-between",
    flexDirection: "row",
    marginTop: 100,
  },
  btnText: {
    fontSize: 38,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "white",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginVertical: 20,
    fontSize: 18,
  },
  toDo: {
    backgroundColor: theme.grey,
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toDoText: { color: "White", fontSize: 16, fontWeight: "500" },
});
