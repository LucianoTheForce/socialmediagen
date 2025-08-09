import {
  CaptionsIcon,
  ArrowLeftRightIcon,
  SparklesIcon,
  StickerIcon,
  MusicIcon,
  VideoIcon,
  BlendIcon,
  SlidersHorizontalIcon,
  LucideIcon,
  TypeIcon,
  SettingsIcon,
  Layers,
  ImageIcon,
} from "lucide-react";
import { create } from "zustand";

export type Tab =
  | "media"
  | "sounds"
  | "text"
  | "templates"
  | "stickers"
  | "effects"
  | "transitions"
  | "captions"
  | "filters"
  | "adjustment"
  | "carousel"
  | "runware"
  | "settings";

export const tabs: { [key in Tab]: { icon: LucideIcon; label: string } } = {
  media: {
    icon: VideoIcon,
    label: "Media",
  },
  sounds: {
    icon: MusicIcon,
    label: "Sounds",
  },
  text: {
    icon: TypeIcon,
    label: "Text",
  },
  templates: {
    icon: Layers,
    label: "Templates",
  },
  stickers: {
    icon: StickerIcon,
    label: "Stickers",
  },
  effects: {
    icon: SparklesIcon,
    label: "Effects",
  },
  transitions: {
    icon: ArrowLeftRightIcon,
    label: "Transitions",
  },
  captions: {
    icon: CaptionsIcon,
    label: "Captions",
  },
  filters: {
    icon: BlendIcon,
    label: "Filters",
  },
  adjustment: {
    icon: SlidersHorizontalIcon,
    label: "Adjustment",
  },
  carousel: {
    icon: Layers,
    label: "Carousel",
  },
  runware: {
    icon: ImageIcon,
    label: "Runware AI",
  },
  settings: {
    icon: SettingsIcon,
    label: "Settings",
  },
};

interface MediaPanelStore {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export const useMediaPanelStore = create<MediaPanelStore>((set) => ({
  activeTab: "media",
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
