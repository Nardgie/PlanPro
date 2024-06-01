import { gql } from '@apollo/client';

export const GET_ME = gql`
  query me {
    me {
      _id
      username
      email
      isAdmin
      savedSessions {
        _id
        name
        description
        presenters
        date
        time
        duration
        room
        conferenceId
      }
      savedBooks {
        authors
        description
        bookId
        image
        link
        title
      }
      bookCount
    }
  }
`;

export const GET_CONFERENCES = gql`
query conferences {
  conferences {
    _id
    name
    description 
    startDate
    endDate
    location
    image
  }
}
`;

export const GET_CONFERENCE = gql`
  query conference($id: ID!) {
    conference(id: $id) {
      _id
      name
      description
      startDate
      endDate
      location
      image
    }
  }
`;



export const GET_SESSIONS_BY_CONFERENCE = gql`
  query getSessionsByConference($conferenceId: ID!) {
    sessionsByConference(conferenceId: $conferenceId) {
      _id
      name
      description
      presenters
      date
      time
      duration
      room
      userCount
      users {
        _id
      }
    }
  }
`;
