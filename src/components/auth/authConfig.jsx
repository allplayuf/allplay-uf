/**
 * Auth Configuration
 * Central source for what requires authentication
 */

export const AUTH_ACTIONS = {
  PROFILE_VIEW: 'profile_view',
  JOIN_MATCH: 'join_match',
  CREATE_MATCH: 'create_match',
  LEAVE_MATCH: 'leave_match',
  CHECK_IN: 'check_in',
  CREATE_TEAM: 'create_team',
  JOIN_TEAM: 'join_team',
  ADD_FRIEND: 'add_friend',
  REPORT_USER: 'report_user',
  REPORT_MATCH: 'report_match',
  COMMUNITY_POST: 'community_post',
  COMMUNITY_COMMENT: 'community_comment',
  VOTE_MVP: 'vote_mvp',
  SETTINGS: 'settings',
  FEEDBACK: 'feedback',
  CREATE_CUP: 'create_cup',
  SIGNUP_CUP: 'signup_cup',
};

export const AUTH_COPY = {
  [AUTH_ACTIONS.PROFILE_VIEW]: {
    title: 'Logga in krävs',
    description: 'För att se din profil behöver du ett konto.'
  },
  [AUTH_ACTIONS.JOIN_MATCH]: {
    title: 'Logga in för att gå med',
    description: 'För att gå med i en match behöver du ett konto hos AllPlay.'
  },
  [AUTH_ACTIONS.CREATE_MATCH]: {
    title: 'Logga in för att skapa match',
    description: 'För att skapa en match behöver du ett konto.'
  },
  [AUTH_ACTIONS.LEAVE_MATCH]: {
    title: 'Logga in krävs',
    description: 'För att lämna en match behöver du ett konto.'
  },
  [AUTH_ACTIONS.CHECK_IN]: {
    title: 'Logga in för att checka in',
    description: 'Checka in kräver ett konto hos AllPlay.'
  },
  [AUTH_ACTIONS.CREATE_TEAM]: {
    title: 'Logga in för att skapa lag',
    description: 'För att skapa ett lag behöver du ett konto.'
  },
  [AUTH_ACTIONS.JOIN_TEAM]: {
    title: 'Logga in för att gå med i lag',
    description: 'För att gå med i ett lag behöver du ett konto.'
  },
  [AUTH_ACTIONS.ADD_FRIEND]: {
    title: 'Logga in för att lägga till vänner',
    description: 'För att lägga till vänner behöver du ett konto.'
  },
  [AUTH_ACTIONS.REPORT_USER]: {
    title: 'Logga in för att rapportera',
    description: 'För att rapportera en användare behöver du ett konto.'
  },
  [AUTH_ACTIONS.REPORT_MATCH]: {
    title: 'Logga in för att rapportera',
    description: 'För att rapportera en match behöver du ett konto.'
  },
  [AUTH_ACTIONS.COMMUNITY_POST]: {
    title: 'Logga in för att posta',
    description: 'För att skapa inlägg i communityn behöver du ett konto.'
  },
  [AUTH_ACTIONS.COMMUNITY_COMMENT]: {
    title: 'Logga in för att kommentera',
    description: 'För att kommentera behöver du ett konto.'
  },
  [AUTH_ACTIONS.VOTE_MVP]: {
    title: 'Logga in för att rösta',
    description: 'För att rösta på MVP behöver du ett konto.'
  },
  [AUTH_ACTIONS.SETTINGS]: {
    title: 'Logga in krävs',
    description: 'För att komma åt inställningar behöver du ett konto.'
  },
  [AUTH_ACTIONS.FEEDBACK]: {
    title: 'Logga in för att ge feedback',
    description: 'För att lämna feedback behöver du ett konto.'
  },
  [AUTH_ACTIONS.CREATE_CUP]: {
    title: 'Logga in för att skapa turnering',
    description: 'För att skapa en turnering behöver du ett konto.'
  },
  [AUTH_ACTIONS.SIGNUP_CUP]: {
    title: 'Logga in för att anmäla dig',
    description: 'För att anmäla dig till en turnering behöver du ett konto.'
  },
  default: {
    title: 'Logga in krävs',
    description: 'För att fortsätta behöver du logga in eller skapa ett konto.'
  }
};