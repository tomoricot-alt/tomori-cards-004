import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StatusBar, View } from 'react-native';
import { EMPTY_DATA, addCard, addDeck, buildQueue, cardsOfDeck, deleteCard, deleteDeck, setCardStatus, updateCard, updateDeck } from './src/logic';
import type { Validation } from './src/logic';
import { loadData, saveData } from './src/storage';
import { colors } from './src/theme';
import type { AppData, Card, CardStatus, StudyMode } from './src/types';
import { HomeScreen } from './src/screens/HomeScreen';
import { CardEditorScreen } from './src/screens/CardEditorScreen';
import { StudyScreen } from './src/screens/StudyScreen';
import { ResultScreen } from './src/screens/ResultScreen';

type Route =
  | { name: 'home' }
  | { name: 'editor'; deckId: string }
  | { name: 'study'; deckId: string; mode: StudyMode; queue: Card[]; run: number }
  | { name: 'result'; deckId: string; results: Record<string, CardStatus> };

export default function App() {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [loaded, setLoaded] = useState(false);
  const [corrupted, setCorrupted] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const runCounter = useRef(0);
  const dataRef = useRef<AppData>(EMPTY_DATA);

  useEffect(() => {
    loadData().then((r) => {
      dataRef.current = r.data;
      setData(r.data);
      setCorrupted(r.corrupted);
      setLoaded(true);
    });
  }, []);

  const commit = useCallback((next: AppData) => {
    dataRef.current = next;
    setData(next);
    saveData(next).then((ok) => setSaveFailed(!ok));
  }, []);

  /** Validation を適用。エラーならメッセージを返す */
  const apply = useCallback(
    (fn: (d: AppData) => Validation<AppData>): string | null => {
      const r = fn(dataRef.current);
      if (!r.ok) return r.error;
      commit(r.value);
      return null;
    },
    [commit],
  );

  const startStudy = (deckId: string, mode: StudyMode, doShuffle: boolean) => {
    const queue = buildQueue(cardsOfDeck(dataRef.current, deckId), mode, doShuffle);
    if (queue.length === 0) return setRoute({ name: 'home' });
    runCounter.current += 1;
    setRoute({ name: 'study', deckId, mode, queue, run: runCounter.current });
  };

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.purple} size="large" />
      </View>
    );
  }

  const deckOf = (id: string) => data.decks.find((d) => d.id === id);

  let screen: React.ReactNode;
  if (route.name === 'editor') {
    const deckId = route.deckId;
    screen = (
      <CardEditorScreen
        data={data}
        deckId={deckId}
        onBack={() => setRoute({ name: 'home' })}
        onAddCard={(f, b) => apply((d) => addCard(d, deckId, f, b))}
        onUpdateCard={(id, f, b) => apply((d) => updateCard(d, id, f, b))}
        onDeleteCard={(id) => commit(deleteCard(dataRef.current, id))}
        onUpdateDeck={(n, s) => apply((d) => updateDeck(d, deckId, n, s))}
        onDeleteDeck={() => {
          commit(deleteDeck(dataRef.current, deckId));
          setRoute({ name: 'home' });
        }}
      />
    );
  } else if (route.name === 'study') {
    const deck = deckOf(route.deckId);
    screen = (
      <StudyScreen
        key={route.run}
        deckName={deck?.name ?? ''}
        cards={route.queue}
        review={route.mode === 'review'}
        onMark={(id, status) => commit(setCardStatus(dataRef.current, id, status))}
        onFinish={(results) => setRoute({ name: 'result', deckId: route.deckId, results })}
        onQuit={() => setRoute({ name: 'home' })}
      />
    );
  } else if (route.name === 'result') {
    const deckId = route.deckId;
    screen = (
      <ResultScreen
        deckName={deckOf(deckId)?.name ?? ''}
        deckCards={cardsOfDeck(data, deckId)}
        results={route.results}
        onReview={() => startStudy(deckId, 'review', true)}
        onRetryAll={() => startStudy(deckId, 'all', true)}
        onHome={() => setRoute({ name: 'home' })}
      />
    );
  } else {
    screen = (
      <HomeScreen
        data={data}
        corrupted={corrupted}
        saveFailed={saveFailed}
        onCreateDeck={(n, s) => apply((d) => addDeck(d, n, s))}
        onOpenDeck={(deckId) => setRoute({ name: 'editor', deckId })}
        onStudy={(deckId) => startStudy(deckId, 'all', false)}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="dark-content" />
      {screen}
    </SafeAreaView>
  );
}
