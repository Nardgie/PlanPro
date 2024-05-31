import { useState, useEffect } from "react";
import { Container, Card, Button, Row, Col } from "react-bootstrap";
import { useQuery, useMutation, useLazyQuery } from "@apollo/client";
import { GET_ME, GET_CONFERENCE } from "../utils/queries";
import { REMOVE_SESSION } from "../utils/mutations";
import Auth from "../utils/auth";
import { formatDate } from "../utils/formatdate";
import { removeSessionId } from "../utils/localStorage";

const SavedSessions = () => {
  const [userData, setUserData] = useState({});
  const [conferenceNames, setConferenceNames] = useState({});
  const [sessionsByConference, setSessionsByConference] = useState({});
  const [sessionConflicts, setSessionConflicts] = useState({});
  const { loading, data, error: getMeError } = useQuery(GET_ME);
  const [removeSession, { error: removeSessionError }] =
    useMutation(REMOVE_SESSION);
  // to get conference name
  const [getConference, { data: conferenceData }] =
    useLazyQuery(GET_CONFERENCE);
  // use this to determine if `useEffect()` hook needs to run again
  const userDataLength = Object.keys(userData).length;

  useEffect(() => {
    if (data) {
      console.log(data);
      setUserData(data.me);
      // Fetch conference names for saved sessions
      data.me.savedSessions.forEach((session) => {
        if (session.conferenceId && !conferenceNames[session.conferenceId]) {
          getConference({ variables: { id: session.conferenceId } });
        }
      });

      // Group sessions by conference
      const groupedSessions = data.me.savedSessions.reduce((acc, session) => {
        if (session.conferenceId) {
          if (!acc[session.conferenceId]) {
            acc[session.conferenceId] = [];
          }
          acc[session.conferenceId].push(session);
        }
        return acc;
      }, {});

      setSessionsByConference(groupedSessions);
      // Detect conflicts
      const conflicts = Object.keys(groupedSessions).reduce(
        (conflictAcc, conferenceId) => {
          const sessions = groupedSessions[conferenceId];
          const timeMap = sessions.reduce((timeAcc, session) => {
            if (!timeAcc[session.time]) {
              timeAcc[session.time] = [];
            }
            timeAcc[session.time].push(session);
            return timeAcc;
          }, {});

          const conferenceConflicts = Object.keys(timeMap).reduce(
            (conflictList, time) => {
              if (timeMap[time].length > 1) {
                conflictList.push(time);
              }
              return conflictList;
            },
            []
          );

          if (conferenceConflicts.length > 0) {
            conflictAcc[conferenceId] = conferenceConflicts;
          }

          return conflictAcc;
        },
        {}
      );
      setSessionConflicts(conflicts);
    }
  }, [data, getConference, conferenceNames]);

  useEffect(() => {
    if (conferenceData && conferenceData.conference) {
      setConferenceNames((prevNames) => ({
        ...prevNames,
        [conferenceData.conference._id]: conferenceData.conference.name,
      }));
    }
  }, [conferenceData]);

  console.log("conflicts:", sessionConflicts);
  // create function that accepts the book's mongo _id value as param and deletes the book from the database
  const handleDeleteSession = async (sessionId) => {
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false;
    }

    try {
      const { data } = await removeSession({
        variables: { userId: userData._id, sessionId: sessionId },
      });

      if (!data) {
        throw new Error("Something went wrong!");
      }

      const updatedUser = data.removeSession;
      setUserData(updatedUser);
      removeSessionId(sessionId);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <h2>LOADING...</h2>;
  }

  if (getMeError) {
    return <h2>Error loading data!</h2>;
  }

  // if data isn't here yet, say so
  if (!userDataLength) {
    return <h2>LOADING...</h2>;
  }
  const styles = {
    text: {
      fontWeight: "bold",
    },
  };
  // console.log(userData);
  return (
    <>
      <div className="text-light bg-dark p-5">
        <Container>
          <h1 className="rock-salt-regular saved-ses">
            Viewing saved sessions!
          </h1>
        </Container>
      </div>
      <Container className="home">
        <h2 className="pt-5 major-mono-display-regular saved-ses">
          {userData.savedSessions.length
            ? `Viewing ${userData.savedSessions.length} saved ${
                userData.savedSessions.length === 1 ? "session" : "sessions"
              }:`
            : "You have no saved sessions!"}
        </h2>
        {Object.keys(sessionsByConference).map((conferenceId) => (
          <div key={conferenceId} className="mb-4">
            <h1 className="mt-5" style={{ fontFamily: "system-ui" }}>
              {conferenceNames[conferenceId] + ":" || "Loading..."}
            </h1>
            <Row>
              {sessionsByConference[conferenceId].map((session) => (
                <Col key={session._id} md="4">
                  <Card border="danger" className="card-session">
                    <Card.Body>
                      <Card.Title>
                        <h3 style={{ fontFamily: "system-ui" }}>
                          {session.name}
                        </h3>
                      </Card.Title>
                      <p className="small" style={styles.text}>
                        Presenters: {session.presenters.join(", ")}
                      </p>
                      <p className="small" style={styles.text}>
                        Date: {formatDate(session.date)}
                      </p>
                      <p className="small" style={styles.text}>
                        Time: {session.time}
                      </p>
                      <p className="small" style={styles.text}>
                        Duration: {session.duration} minutes
                      </p>
                      <p className="small" style={styles.text}>
                        Room: {session.room}
                      </p>
                      <Card.Text>{session.description}</Card.Text>
                      <Button
                        className="btn-block btn-danger"
                        onClick={() => handleDeleteSession(session._id)}
                      >
                        Delete this Session! &nbsp;
                        <i className="fa-solid fa-trash-can fa-fade"></i>
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        ))}
      </Container>
    </>
  );
};

export default SavedSessions;
