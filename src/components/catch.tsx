import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEvent, useEventListener } from 'expo';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Icon } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import type { ActivityId } from '@/data/activities';

const C = Colors.dark;
const SITE = 'https://saltcastflorida.com';
const CACHE_KEY = 'catch:list';
const EVERY = 3000; // rotation speed, ms (same as the website)

type Tab = 'fishing' | 'surfing' | 'diving' | 'boating';
/** img is the photo, or the still shown before a video plays; video is a short MP4 on the website. */
type Entry = { img: string; name: string; town: string; what?: string; week?: string; alt?: string; video?: string };

const MaxBytes = 8 * 1024 * 1024; // the website's form host refuses bigger files
const VideoMax = 40_000; // a video holds the rotation until it ends, or this long at most (same as the website)
const full = (u: string) => (u.startsWith('http') ? u : SITE + u);
type CatchList = Partial<Record<Tab, Entry[]>>;

const TABS: { id: Tab; label: string; form: string }[] = [
  { id: 'fishing', label: 'Fishing', form: 'Fishing' },
  { id: 'surfing', label: 'Surfing', form: 'Surfing' },
  { id: 'diving', label: 'Diving', form: 'Diving' },
  { id: 'boating', label: 'Boating', form: 'Boating' },
];

function tabFor(activityId: ActivityId): Tab {
  if (activityId === 'surfing' || activityId === 'diving') return activityId;
  if (activityId === 'boating' || activityId === 'sailing' || activityId === 'paddling') return 'boating';
  return 'fishing';
}

/** Reads the winners from saltcastflorida.com/catch.json (made from the website's Share Your Saltcast Pics list on every deploy). */
function useCatchList() {
  const [list, setList] = useState<CatchList>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(CACHE_KEY)
      .then((s) => {
        if (live && s) setList((cur) => cur ?? (JSON.parse(s) as CatchList));
      })
      .catch(() => {});
    fetch(`${SITE}/catch.json`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { catch?: CatchList }) => {
        if (!live || !j?.catch) return;
        setList(j.catch);
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(j.catch)).catch(() => {});
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);
  return { list, failed };
}

export function CatchOfTheWeek({ activityId }: { activityId: ActivityId }) {
  const { list, failed } = useCatchList();
  const [tab, setTab] = useState<Tab>(tabFor(activityId));
  const [pos, setPos] = useState(0);
  const [sending, setSending] = useState(false);
  const entries = list?.[tab] ?? [];
  const count = entries.length;

  const shown = count ? entries[pos % count] : undefined;
  const next = () => count > 1 && setPos((p) => (p + 1) % count);

  useEffect(() => {
    if (count < 2) return;
    const t = setTimeout(() => setPos((p) => (p + 1) % count), shown?.video ? VideoMax : EVERY);
    return () => clearTimeout(t);
  }, [count, tab, pos, shown?.video]);

  if (!list && failed) return null;

  return (
    <Card>
      <View style={styles.head}>
        <ThemedText style={styles.title}>Share Your Saltcast Pics</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          From Saltcast readers
        </ThemedText>
      </View>
      <View style={styles.tabs}>
        {TABS.map((t) => {
          const on = t.id === tab;
          return (
            <Pressable
              key={t.id}
              onPress={() => {
                setTab(t.id);
                setPos(0);
              }}
              style={[styles.tab, on && styles.tabOn]}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}>
              <ThemedText type="smallBold" style={{ color: on ? C.background : C.text }}>
                {t.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {!list ? (
        <ActivityIndicator color={C.accent} />
      ) : shown ? (
        <>
          {shown.video ? (
            <CatchVideo key={shown.video} uri={full(shown.video)} poster={full(shown.img)} label={shown.alt || `${shown.name}, ${shown.town}`} onEnd={next} />
          ) : (
            <Pressable
              onPress={next}
              accessibilityRole="image"
              accessibilityLabel={shown.alt || `${shown.name}, ${shown.town}`}
              accessibilityHint={count > 1 ? 'Tap for the next photo' : undefined}>
              <Image source={{ uri: full(shown.img) }} style={styles.photo} contentFit="cover" transition={300} />
            </Pressable>
          )}
          <View style={styles.caption}>
            {shown.video ? (
              <ThemedText type="smallBold" style={styles.vtag}>
                ▶ Video
              </ThemedText>
            ) : null}
            <ThemedText type="smallBold">{shown.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {shown.town}
            </ThemedText>
            {shown.what ? (
              <ThemedText type="smallBold" themeColor="accent">
                {shown.what}
              </ThemedText>
            ) : null}
          </View>
          {count > 1 ? (
            <View style={styles.dots}>
              {entries.map((e, k) => (
                <Pressable
                  key={e.img + k}
                  onPress={() => setPos(k)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Photo ${k + 1} of ${count}: ${e.name}`}
                  style={[styles.dot, k === pos % count && styles.dotOn]}
                />
              ))}
            </View>
          ) : null}
        </>
      ) : (
        <ThemedText type="small">
          <ThemedText type="smallBold">No {TABS.find((t) => t.id === tab)?.label.toLowerCase()} photo yet.</ThemedText> Be the first.
          Send us yours below.
        </ThemedText>
      )}

      {sending ? (
        <SendPhotoForm tab={tab} onClose={() => setSending(false)} />
      ) : (
        <Pressable onPress={() => setSending(true)} style={styles.sendBtn} accessibilityRole="button">
          <Icon name="camera" size={16} />
          <ThemedText type="smallBold" themeColor="accent">
            Send us your photo or video
          </ThemedText>
        </Pressable>
      )}
    </Card>
  );
}

/**
 * A reader's short video: plays once, muted, without stopping the phone's music (like the website).
 * The controls turn on the sound or go full screen. The still shows until the video is ready.
 */
function CatchVideo({ uri, poster, label, onEnd }: { uri: string; poster: string; label: string; onEnd: () => void }) {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
    p.loop = false;
    p.audioMixingMode = 'mixWithOthers';
    p.play();
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  useEventListener(player, 'playToEnd', onEnd);
  return (
    <View style={styles.photo} accessibilityLabel={`Video: ${label}`}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls fullscreenOptions={{ enable: true }} />
      {status !== 'readyToPlay' ? (
        <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} contentFit="cover" pointerEvents="none" />
      ) : null}
    </View>
  );
}

/** Sends to the same Netlify form ("catch") as the website, so entries land in one inbox. */
function SendPhotoForm({ tab, onClose }: { tab: Tab; onClose: () => void }) {
  const [name, setName] = useState('');
  const [town, setTown] = useState('');
  const [email, setEmail] = useState('');
  const [caption, setCaption] = useState('');
  const [activity, setActivity] = useState<Tab>(tab);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset>();
  const [ok, setOk] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const [link, setLink] = useState('');
  const isVideo = photo?.type === 'video';

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.7,
      exif: false,
      // Videos come back as 720p H.264 MP4, which keeps a 10-second clip well under the 8 MB limit.
      videoExportPreset: ImagePicker.VideoExportPreset.H264_1280x720,
    });
    if (r.canceled || !r.assets[0]) return;
    const a = r.assets[0];
    if (a.fileSize && a.fileSize > MaxBytes) {
      setMsg(
        a.type === 'video'
          ? 'That video is too big (over 8 MB). Trim it to about 10 seconds, or post it on YouTube, Instagram or TikTok and paste the link.'
          : 'That photo is over 8 MB. Try a smaller copy.',
      );
      return;
    }
    setMsg('');
    setPhoto(a);
  };
  const linkOk = !link.trim() || /^https?:\/\/\S+\.\S+/i.test(link.trim());

  const missing = !name.trim()
    ? 'Add your first name and last initial.'
    : !town.trim()
      ? 'Add your town.'
      : !/^\S+@\S+\.\S+$/.test(email.trim())
        ? 'Add an email so we can reach you.'
        : !photo && !link.trim()
          ? 'Pick a photo or video, or paste a video link.'
          : !linkOk
            ? 'Check the video link (it should start with https://).'
            : !ok
            ? 'Turn on the permission switch.'
            : '';

  const send = async () => {
    if (missing) {
      setMsg(missing);
      return;
    }
    setState('sending');
    setMsg('');
    const body = new FormData();
    body.append('form-name', 'catch');
    body.append('bot-field', '');
    body.append('name', name.trim().slice(0, 40));
    body.append('town', town.trim().slice(0, 40));
    body.append('activity', TABS.find((t) => t.id === activity)?.form ?? 'Fishing');
    body.append('email', email.trim().slice(0, 80));
    body.append('caption', caption.trim().slice(0, 120));
    body.append('video_link', link.trim().slice(0, 300));
    body.append('permission', 'yes');
    if (photo) {
      const video = photo.type === 'video';
      const type = video
        ? photo.mimeType === 'video/quicktime' ? 'video/quicktime' : 'video/mp4'
        : photo.mimeType && photo.mimeType !== 'image/heic' ? photo.mimeType : 'image/jpeg';
      const ext = video ? (type === 'video/quicktime' ? 'mov' : 'mp4') : type === 'image/png' ? 'png' : 'jpg';
      // React Native's FormData takes a { uri, name, type } object for a file.
      body.append('photo', { uri: photo.uri, name: `catch.${ext}`, type } as unknown as Blob);
    }
    try {
      const r = await fetch(`${SITE}/`, { method: 'POST', body, headers: { Accept: 'text/html' } });
      if (!r.ok) throw new Error(String(r.status));
      setState('sent');
    } catch {
      setState('error');
      setMsg("Couldn't send it. Check your connection and try again.");
    }
  };

  if (state === 'sent') {
    return (
      <View style={styles.form}>
        <ThemedText type="smallBold" style={{ color: C.go }}>
          Thanks! Your {isVideo || (!photo && link) ? 'video' : 'photo'} was sent.
        </ThemedText>
        <ThemedText type="small">We look at every entry and post our favorites.</ThemedText>
        <Pressable onPress={onClose} style={styles.sendBtn} accessibilityRole="button">
          <ThemedText type="smallBold" themeColor="accent">
            Done
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <ThemedText style={styles.formTitle}>Send us your photo or video</ThemedText>
      <Field label="First name and last initial" value={name} onChange={setName} placeholder="e.g. Dave T." max={40} />
      <Field label="Town" value={town} onChange={setTown} placeholder="e.g. Clearwater, FL" max={40} />
      <ThemedText type="small" themeColor="textSecondary">
        Activity
      </ThemedText>
      <View style={styles.tabs}>
        {TABS.map((t) => {
          const on = t.id === activity;
          return (
            <Pressable key={t.id} onPress={() => setActivity(t.id)} style={[styles.tab, on && styles.tabOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
              <ThemedText type="smallBold" style={{ color: on ? C.background : C.text }}>
                {t.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      <Field label="Email (not shown, only so we can reach you)" value={email} onChange={setEmail} max={80} email />
      <Field label="What did you catch or ride? (optional)" value={caption} onChange={setCaption} placeholder="e.g. 28 inch redfish on a jig" max={120} />

      <Pressable onPress={pick} style={styles.pick} accessibilityRole="button">
        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.thumb} contentFit="cover" />
        ) : (
          <Icon name="photo.on.rectangle" size={22} />
        )}
        <View style={{ flex: 1 }}>
          <ThemedText type="smallBold" themeColor="accent">
            {photo ? (isVideo ? 'Change video' : 'Change photo') : 'Choose a photo or short video'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Under 8 MB, so keep videos to about 10 seconds.
          </ThemedText>
        </View>
      </Pressable>
      <Field
        label="Longer video? Paste a link instead (YouTube, Instagram, TikTok or Facebook, optional)"
        value={link}
        onChange={setLink}
        placeholder="https://"
        max={300}
        url
      />

      <View style={styles.okRow}>
        <Switch value={ok} onValueChange={setOk} trackColor={{ true: C.accent }} accessibilityLabel="Permission to share" />
        <ThemedText type="small" style={{ flex: 1 }}>
          I took this photo or video or have the owner&apos;s OK, everyone in it agrees to it being shared, and Saltcast Florida may post it on its
          website, app and social pages.
        </ThemedText>
      </View>

      {msg ? (
        <ThemedText type="small" style={{ color: state === 'error' ? C.noGo : C.maybe }}>
          {msg}
        </ThemedText>
      ) : null}

      <View style={styles.formButtons}>
        <Pressable onPress={send} disabled={state === 'sending'} style={[styles.submit, state === 'sending' && { opacity: 0.6 }]} accessibilityRole="button">
          {state === 'sending' ? <ActivityIndicator color={C.background} /> : null}
          <ThemedText type="smallBold" style={{ color: C.background }}>
            {state === 'sending' ? 'Sending…' : 'Send'}
          </ThemedText>
        </Pressable>
        <Pressable onPress={onClose} style={styles.cancel} accessibilityRole="button">
          <ThemedText type="smallBold" themeColor="textSecondary">
            Cancel
          </ThemedText>
        </Pressable>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        We post our favorites. Only your first name, last initial and town are shown.
      </ThemedText>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  max,
  email,
  url,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  max: number;
  email?: boolean;
  url?: boolean;
}) {
  return (
    <View style={{ gap: 4 }}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.textSecondary}
        maxLength={max}
        style={styles.input}
        autoCapitalize={email || url ? 'none' : 'words'}
        autoCorrect={!email && !url}
        keyboardType={email ? 'email-address' : url ? 'url' : 'default'}
        textContentType={email ? 'emailAddress' : url ? 'URL' : undefined}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  head: { gap: 2 },
  title: { fontSize: 17, lineHeight: 22, fontWeight: 700 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tab: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: C.border, minHeight: 34, justifyContent: 'center' },
  tabOn: { backgroundColor: C.accent, borderColor: C.accent },
  photo: { width: '100%', aspectRatio: 4 / 5, borderRadius: 12, backgroundColor: C.backgroundSelected },
  caption: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: Spacing.two },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingTop: 2 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.border },
  dotOn: { backgroundColor: C.accent },
  vtag: { color: C.accent },
  sendBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 8, minHeight: 44 },
  form: { gap: Spacing.two, paddingTop: Spacing.one, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
  formTitle: { fontSize: 16, lineHeight: 22, fontWeight: 700, paddingTop: Spacing.one },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: C.text,
    fontSize: 16,
    backgroundColor: C.background,
  },
  pick: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', minHeight: 44 },
  thumb: { width: 56, height: 56, borderRadius: 8 },
  okRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  formButtons: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  submit: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 11, minHeight: 44 },
  cancel: { paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
});
