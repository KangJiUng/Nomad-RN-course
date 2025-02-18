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
  const [editingToDo, setEditingToDo] = useState(null); // 수정 중인 toDo의 key
  const [editedText, setEditedText] = useState(""); // 수정할 텍스트

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
    const newToDos = {
      ...toDos,
      [Date.now()]: { text, working, completed: false },
    };

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

  const completeTodo = async (key) => {
    const newToDos = { ...toDos };
    newToDos[key].completed = !newToDos[key].completed; // true/false 토글
    setToDos(newToDos);
    saveToDos(newToDos);
  };

  const startEditing = (key) => {
    setEditingToDo(key); // 현재 수정 중인 toDo 설정
    setEditedText(toDos[key].text); // 기존 텍스트를 input에 적용
  };

  const finishEditing = async (key) => {
    if (editedText.trim() === "") {
      return;
    }
    const newToDos = { ...toDos };
    newToDos[key].text = editedText;
    setToDos(newToDos);
    await saveToDos(newToDos);
    setEditingToDo(null); // 수정 모드 종료
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
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
              {/* 수정 중이면 TextInput, 아니면 Text */}
              {editingToDo === key ? (
                <TextInput
                  style={styles.toDoText}
                  value={editedText}
                  returnKeyType="done"
                  onChangeText={setEditedText}
                  onSubmitEditing={() => finishEditing(key)}
                  autoFocus
                />
              ) : (
                <Text
                  style={{
                    ...styles.toDoText,
                    textDecorationLine: toDos[key].completed
                      ? "line-through"
                      : "none",
                    color: toDos[key].completed ? "grey" : "black",
                  }}
                >
                  {toDos[key].text}
                </Text>
              )}

              <View style={styles.iconContainer}>
                {/* 체크박스 버튼 (완료 상태 변경) */}
                <TouchableOpacity onPress={() => completeTodo(key)}>
                  <Icon name="checkbox-outline" size={22} color="black" />
                </TouchableOpacity>

                {/* 수정 버튼 */}
                <TouchableOpacity onPress={() => startEditing(key)}>
                  <Icon name="pencil-outline" size={22} color="black" />
                </TouchableOpacity>

                {/* 삭제 버튼 */}
                <TouchableOpacity onPress={() => deleteTodo(key)}>
                  <Icon name="trash-outline" size={22} color="black" />
                </TouchableOpacity>
              </View>
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
  toDoText: {
    fontSize: 16,
    fontWeight: "500",
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
});
