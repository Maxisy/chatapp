import "./App.css";

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { useEffect, useRef, useState } from "react";

initializeApp({
  apiKey: "AIzaSyDT5PSz6Z-FnFvecYyxM9WDVinZ-QU3bPc",
  authDomain: "chatapp-88308.firebaseapp.com",
  projectId: "chatapp-88308",
  storageBucket: "chatapp-88308.appspot.com",
  messagingSenderId: "427820483592",
  appId: "1:427820483592:web:cd8bc4214b2ca660047dbd",
  measurementId: "G-TPH1JRPPLR",
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
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorTitle, seterrorTitle] = useState("");
  const [errorDescription, setErrorDescription] = useState("");

  const showError = (title, description) => {
    seterrorTitle(title);
    setErrorDescription(description);
    setErrorVisible(true);
  };

  const logInHandler = () => {
    setLogIn(true);
  };

  const registerHandler = () => {
    setLogIn(false);
  };

  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
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
        <br />
        <button onClick={signInWithGoogle} className="sign-in-button">
          {/* <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRu1PJmT_THldF0n5APcmt9p10utgu6KSw4cH2fQ5Xhpw&s" /> */}
          &nbsp;Sign in with Google
        </button>
      </div>
    );
  } else {
    return (
      <div>
        {errorVisible && (
          <div className="error-div">
            <h2>{errorTitle}</h2>
            <p>{errorDescription}</p>
          </div>
        )}
        {logIn ? (
          <SignInForm action="LOG_IN" showErrorFunction={showError} />
        ) : (
          <SignInForm action="REGISTER" showErrorFunction={showError} />
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

const handleSignIn = (action, email, password, showErrorFunction) => {
  if (action === "REGISTER") {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log(userCredential.user);
        return true;
      })
      .catch((error) => {
        const errorCode = error.code;

        console.warn(errorCode);
        if (errorCode === "auth/email-already-in-use") {
          showErrorFunction(
            "Invalid email",
            "This email address is already in use."
          );
        }
        if (errorCode === "auth/weak-password") {
          showErrorFunction(
            "Weak password",
            "Password must be minimum 6 characters."
          );
        }

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

        console.warn(errorCode);
        if (errorCode === "auth/user-not-found") {
          showErrorFunction(
            "Registration required",
            "Reload the page and use the register button first."
          );
        }
        if (errorCode === "auth/wrong-password") {
          showErrorFunction(
            "Invalid password",
            "This password is invalid, if you forgot it contact an admin."
          );
        }

        return false;
      });
  }
};

const SignInForm = (props) => {
  const [enteredEmail, setEnteredEmail] = useState("");
  const [enteredPassword, setEnteredPassword] = useState("");
  const [, setSuccessfullyRegistered] = useState();
  const [isInputValid, setIsInputValid] = useState(false);

  useEffect(() => {
    if (
      enteredEmail.toString().includes("@") &&
      enteredPassword.trim().length > 6
    ) {
      setIsInputValid(true);
    } else {
      setIsInputValid(false);
    }
  }, [enteredEmail, enteredPassword]);

  const formSubmitHandler = (event) => {
    event.preventDefault();
    const effect = handleSignIn(
      props.action,
      enteredEmail,
      enteredPassword,
      props.showErrorFunction
    );
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
      <input type="email" onChange={emailInputChangeHandler}></input>
      <br />
      <label className="sign-in-label">Password</label>
      <br />
      <input type="password" onChange={passwordInputChangeHandler}></input>
      <br />
      <div className="info-div">
        <h2>Password info</h2>
        <p>Password must be at least 6 characters long.</p>
      </div>
      <button type="submit" disabled={!isInputValid}>
        Sign In
      </button>
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
      signature: auth.currentUser.email,
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
    </div>
  );
};

export default App;
