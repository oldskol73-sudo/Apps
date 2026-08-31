// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react-native";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
    }),
    bookmarks: i.entity({
      ref: i.string().indexed(),
      book: i.string(),
      chapter: i.number(),
      verse: i.number(),
      createdAt: i.number().indexed(),
    }),
    highlights: i.entity({
      ref: i.string().indexed(),
      book: i.string(),
      chapter: i.number(),
      verse: i.number(),
      color: i.string(),
      createdAt: i.number().indexed(),
    }),
    notes: i.entity({
      ref: i.string().indexed(),
      book: i.string(),
      chapter: i.number(),
      verse: i.number(),
      text: i.string(),
      createdAt: i.number().indexed(),
    }),
    planProgress: i.entity({
      kind: i.string().indexed(), // 'chrono' | 'sin' | 'studyCategory' | 'studyWeekly'
      key: i.string().indexed(), // day number (as string) or sin key
    }),
    settings: i.entity({
      atmosphere: i.string(), // 'parchment' | 'stone' | 'midnight'
      readerFontSize: i.number(),
      notificationsOn: i.boolean(),
    }),
    narrations: i.entity({
      bookChapter: i.string().unique().indexed(),
      name: i.string(),
    }),
  },
  rooms: {},
  links: {
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
    bookmarksOwner: {
      forward: { on: "bookmarks", has: "one", label: "owner" },
      reverse: { on: "$users", has: "many", label: "bookmarks" },
    },
    highlightsOwner: {
      forward: { on: "highlights", has: "one", label: "owner" },
      reverse: { on: "$users", has: "many", label: "highlights" },
    },
    notesOwner: {
      forward: { on: "notes", has: "one", label: "owner" },
      reverse: { on: "$users", has: "many", label: "notes" },
    },
    planProgressOwner: {
      forward: { on: "planProgress", has: "one", label: "owner" },
      reverse: { on: "$users", has: "many", label: "planProgress" },
    },
    settingsOwner: {
      forward: { on: "settings", has: "one", label: "owner" },
      reverse: { on: "$users", has: "one", label: "settings" },
    },
    narrationsOwner: {
      forward: { on: "narrations", has: "one", label: "owner" },
      reverse: { on: "$users", has: "many", label: "narrations" },
    },
    narrationsFile: {
      forward: { on: "narrations", has: "one", label: "audioFile" },
      reverse: { on: "$files", has: "one", label: "narration" },
    },
  },
});

// This helps TypeScript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
