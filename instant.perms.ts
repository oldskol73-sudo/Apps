// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react-native";

const ownerRules = {
  allow: {
    view: "isOwner",
    create: "isOwner",
    update: "isOwner",
    delete: "isOwner",
  },
  bind: ["isOwner", "auth.id != null && auth.id in data.ref('owner.id')"],
};

const rules = {
  bookmarks: ownerRules,
  highlights: ownerRules,
  notes: ownerRules,
  planProgress: ownerRules,
  settings: ownerRules,
  narrations: ownerRules,
  // Narration uploads are stored at `narrations/<userId>/<bookChapter>-<filename>`,
  // so path-based rules (data.ref doesn't work for $files) scope access to the owner.
  $files: {
    allow: {
      view: "auth.id != null && data.path.startsWith('narrations/' + auth.id + '/')",
      create: "auth.id != null && data.path.startsWith('narrations/' + auth.id + '/')",
      delete: "auth.id != null && data.path.startsWith('narrations/' + auth.id + '/')",
    },
  },
} satisfies InstantRules;

export default rules;
