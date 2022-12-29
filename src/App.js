import "./App.css";

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getAuth,
} from "firebase/auth";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { useRef, useState } from "react";

initializeApp({
  apiKey: "AIzaSyDT5PSz6Z-FnFvecYyxM9WDVinZ-QU3bPc",
  authDomain: "chatapp-88308.firebaseapp.com",
  projectId: "chatapp-88308",
  storageBucket: "chatapp-88308.appspot.com",
  messagingSenderId: "427820483592",
  appId: "1:427820483592:web:310cf90b12875da2047dbd",
  measurementId: "G-5KVMM18VKP",
});

const auth = getAuth();
const firestore = getFirestore();

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header>{user ? <SignOut /> : <h1>Sign in to chat</h1>}</header>

      <section>{user ? <ChatRoom /> : <SignIn />}</section>
    </div>
  );
}

const SignIn = () => {
  const [logIn, setLogIn] = useState();
  const errorDivRef = useRef();

  const logInHandler = () => {
    setLogIn(true);
  };

  const registerHandler = () => {
    setLogIn(false);
  };

  if (logIn === undefined) {
    return (
      <div>
        <button onClick={logInHandler} className="sign-in-button">
          Log in
        </button>
        <br />
        <button onClick={registerHandler} className="sign-in-button">
          Register
        </button>
      </div>
    );
  } else {
    return (
      <div>
        <div className="error-div" hidden ref={errorDivRef}></div>
        {logIn ? (
          <SignInForm action="LOG_IN" errorDiv={errorDivRef} />
        ) : (
          <SignInForm action="REGISTER" errorDiv={errorDivRef} />
        )}
      </div>
    );
  }
};

const SignOut = () => {
  return (
    auth.currentUser && (
      <button className="sign-out" onClick={() => auth.signOut()}>
        Sign Out
      </button>
    )
  );
};

const handleSignIn = (action, email, password, errorDiv) => {
  if (action === "REGISTER") {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log(userCredential.user);
        return true;
      })
      .catch((error) => {
        const errorMessage = error.message;
        console.error(errorMessage);
        return false;
      });
  } else {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log(userCredential.user);
        return true;
      })
      .catch((error) => {
        const errorCode = error.code;
        
        if (errorCode === "auth/user-not-found") {
          errorDiv.innerHTML = "<h2>Please register first</h2><br /><p>Please refresh the page and register first before logging in</p>";
          console.log(errorDiv.props);
        }

        return false;
      });
  }
};

const SignInForm = (props) => {
  const [enteredEmail, setEnteredEmail] = useState("");
  const [enteredPassword, setEnteredPassword] = useState("");
  const [, setSuccessfullyRegistered] = useState();

  const formSubmitHandler = (event) => {
    event.preventDefault();
    const effect = handleSignIn(props.action, enteredEmail, enteredPassword, props.errorDiv);
    setSuccessfullyRegistered(effect);
  };

  const emailInputChangeHandler = (event) => {
    setEnteredEmail(event.target.value);
  };

  const passwordInputChangeHandler = (event) => {
    setEnteredPassword(event.target.value);
  };

  return (
    <form onSubmit={formSubmitHandler} className="sign-in-form">
      <label className="sign-in-label">Email</label>
      <br />
      <input
        type="email"
        onChange={emailInputChangeHandler}
      ></input>
      <br />
      <label className="sign-in-label">Password</label>
      <br />
      <input
        type="password"
        onChange={passwordInputChangeHandler}
      ></input>
      <br />
      <button type="submit">Sign In</button>
    </form>
  );
};

const ChatRoom = () => {
  const dummy = useRef();

  const messagesRef = collection(firestore, "messages");
  const dbQuery = query(messagesRef, orderBy("createdAt"));

  const [messages] = useCollectionData(dbQuery, { id: "id" });

  const [formValue, setFormValue] = useState("");

  const sendMessageHandler = async (e) => {
    e.preventDefault();
    console.log(formValue);

    if (formValue === "") {
      return;
    }

    const { uid } = auth.currentUser;

    await addDoc(messagesRef, {
      text: formValue,
      createdAt: serverTimestamp(),
      uid,
      signature: auth.currentUser.email
    });

    setFormValue("");

    dummy.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <main>
        {messages &&
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}

        <div ref={dummy}></div>
      </main>

      <form onSubmit={sendMessageHandler} className="chat-form">
        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder="chat here"
          className="message-input"
        />
        <button type="submit">Send</button>
      </form>
    </>
  );
};

const ChatMessage = (props) => {
  const { text, uid, signature } = props.message;

  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";

  return (
    <div key={props.key} className={`full-message ${messageClass}`}>
      <sig className={`${messageClass}`}>{signature}</sig>
      <div className={`message ${messageClass}`}>
        <p>{text}</p>
      </div>
      {/* <div className={`${messageClass} signature`}> */}

      {/* </div> */}
    </div>
  );
};

export default App;
