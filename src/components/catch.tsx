import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
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
const EVERY = 6000; // rotation speed, ms (same as the website)

type Tab = 'fishing' | 'surfing' | 'diving' | 'boating';
type Entry = { img: string; name: string; town: string; what?: string; week?: string; alt?: string };
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

/** Reads the winners from saltcastflorida.com/catch.json (made from the website's Catch of the Week list on every deploy). */
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

  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(() => setPos((p) => (p + 1) % count), EVERY);
    return () => clearInterval(t);
  }, [count, tab, pos]);

  if (!list && failed) return null;
  const shown = count ? entries[pos % count] : undefined;

  return (
    <Card>
      <View style={styles.head}>
        <ThemedText style={styles.title}>Catch of the Week</ThemedText>
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
          <Pressable
            onPress={() => count > 1 && setPos((p) => (p + 1) % count)}
            accessibilityRole="image"
            accessibilityLabel={shown.alt || `${shown.name}, ${shown.town}`}
            accessibilityHint={count > 1 ? 'Tap for the next photo' : undefined}>
            <Image
              source={{ uri: shown.img.startsWith('http') ? shown.img : SITE + shown.img }}
              style={styles.photo}
              contentFit="cover"
              transition={300}
            />
          </Pressable>
          <View style={styles.caption}>
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
          {shown.week ? (
            <ThemedText type="small" themeColor="textSecondary">
              {shown.week}
            </ThemedText>
          ) : null}
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
          Send us yours and it could be next week&apos;s pick.
        </ThemedText>
      )}

      {sending ? (
        <SendPhotoForm tab={tab} onClose={() => setSending(false)} />
      ) : (
        <Pressable onPress={() => setSending(true)} style={styles.sendBtn} accessibilityRole="button">
          <Icon name="camera" size={16} />
          <ThemedText type="smallBold" themeColor="accent">
            Send us your photo
          </ThemedText>
        </Pressable>
      )}
    </Card>
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

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, exif: false });
    if (!r.canceled && r.assets[0]) setPhoto(r.assets[0]);
  };

  const missing = !name.trim()
    ? 'Add your first name and last initial.'
    : !town.trim()
      ? 'Add your town.'
      : !/^\S+@\S+\.\S+$/.test(email.trim())
        ? 'Add an email so we can reach you.'
        : !photo
          ? 'Pick a photo.'
          : !ok
            ? 'Turn on the permission switch.'
            : '';

  const send = async () => {
    if (missing || !photo) {
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
    body.append('permission', 'yes');
    const type = photo.mimeType && photo.mimeType !== 'image/heic' ? photo.mimeType : 'image/jpeg';
    const ext = type === 'image/png' ? 'png' : 'jpg';
    // React Native's FormData takes a { uri, name, type } object for a file.
    body.append('photo', { uri: photo.uri, name: `catch.${ext}`, type } as unknown as Blob);
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
          Thanks! Your photo was sent.
        </ThemedText>
        <ThemedText type="small">We look at every entry and pick a Catch of the Week each week.</ThemedText>
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
      <ThemedText style={styles.formTitle}>Send us your photo</ThemedText>
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
        <ThemedText type="smallBold" themeColor="accent">
          {photo ? 'Change photo' : 'Choose a photo'}
        </ThemedText>
      </Pressable>

      <View style={styles.okRow}>
        <Switch value={ok} onValueChange={setOk} trackColor={{ true: C.accent }} accessibilityLabel="Permission to share" />
        <ThemedText type="small" style={{ flex: 1 }}>
          I took this photo or have the owner&apos;s OK, everyone in it agrees to it being shared, and Saltcast Florida may post it on its
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
            {state === 'sending' ? 'Sending…' : 'Send photo'}
          </ThemedText>
        </Pressable>
        <Pressable onPress={onClose} style={styles.cancel} accessibilityRole="button">
          <ThemedText type="smallBold" themeColor="textSecondary">
            Cancel
          </ThemedText>
        </Pressable>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        We pick one photo per activity each week. Only your first name, last initial and town are shown.
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  max: number;
  email?: boolean;
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
        autoCapitalize={email ? 'none' : 'words'}
        autoCorrect={!email}
        keyboardType={email ? 'email-address' : 'default'}
        textContentType={email ? 'emailAddress' : undefined}
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
