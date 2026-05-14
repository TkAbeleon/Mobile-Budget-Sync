import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import type { ChatMessage, ChatResponse } from '@/lib/types';

const SUGGESTIONS = [
  'Combien ai-je dépensé ce mois ?',
  'Comment améliorer mon budget ?',
  'Quelles sont mes catégories principales ?',
  'Conseils pour épargner davantage',
];

interface MessageBubble extends ChatMessage {
  id: string;
  suggestions?: string[];
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const flatRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<MessageBubble[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Bonjour ! Je suis votre assistant budget BudgetSmart. Comment puis-je vous aider ?',
      suggestions: SUGGESTIONS,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg = text.trim();
    setInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const msgId = Date.now().toString() + Math.random().toString(36).slice(2);
    setMessages((prev) => [
      ...prev,
      { id: msgId, role: 'user', content: userMsg },
    ]);

    setLoading(true);
    try {
      const res = await api.post<ChatResponse>('/chat/message', { question: userMsg });
      const replyId = Date.now().toString() + Math.random().toString(36).slice(2);
      setMessages((prev) => [
        ...prev,
        {
          id: replyId,
          role: 'assistant',
          content: res.response,
          suggestions: res.suggestions?.slice(0, 3),
        },
      ]);
    } catch {
      const errId = Date.now().toString() + Math.random().toString(36).slice(2);
      setMessages((prev) => [
        ...prev,
        {
          id: errId,
          role: 'assistant',
          content: "Désolé, je rencontre une difficulté. Veuillez réessayer dans un instant.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function renderItem({ item }: { item: MessageBubble }) {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgWrap, isUser && styles.msgWrapUser]}>
        {!isUser ? (
          <View style={[styles.aiAvatar, { backgroundColor: colors.primaryDim, borderColor: 'rgba(14,224,122,0.2)' }]}>
            <Feather name="cpu" size={14} color={colors.primary} />
          </View>
        ) : null}
        <View style={styles.bubbleColumn}>
          <View
            style={[
              styles.bubble,
              isUser
                ? [styles.userBubble, { backgroundColor: colors.primaryDim, borderColor: 'rgba(14,224,122,0.2)' }]
                : [styles.aiBubble, { backgroundColor: colors.surface2, borderColor: colors.border }],
            ]}
          >
            <Text style={[styles.bubbleText, { color: colors.t1 }]}>{item.content}</Text>
          </View>
          {!isUser && item.suggestions && item.suggestions.length > 0 ? (
            <View style={styles.suggestions}>
              {item.suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.suggestion, { backgroundColor: colors.surface2, borderColor: colors.border }]}
                  onPress={() => sendMessage(s)}
                >
                  <Text style={[styles.suggestionText, { color: colors.t2 }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
        {isUser ? (
          <View style={[styles.userAvatar, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <Feather name="user" size={14} color={colors.t2} />
          </View>
        ) : null}
      </View>
    );
  }

  const bottomPad = insets.bottom + 12;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.msgList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          loading ? (
            <View style={[styles.typingWrap, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.typingText, { color: colors.t3 }]}>Assistant répond...</Text>
            </View>
          ) : null
        }
      />

      <View style={[styles.inputArea, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: bottomPad }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.t1 }]}
          placeholderTextColor={colors.t3}
          placeholder="Posez une question sur votre budget..."
          multiline
          value={input}
          onChangeText={setInput}
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.surface2, borderColor: colors.border }]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || loading}
        >
          <Feather
            name="send"
            size={18}
            color={input.trim() ? '#0C0F1A' : colors.t3}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  msgList: {
    padding: 16,
    gap: 16,
    paddingBottom: 8,
  },
  msgWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '88%',
  },
  msgWrapUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 2,
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 2,
  },
  bubbleColumn: {
    gap: 8,
    flex: 1,
  },
  bubble: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  aiBubble: {
    borderTopLeftRadius: 4,
  },
  userBubble: {
    borderTopRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
  },
  suggestions: {
    gap: 6,
  },
  suggestion: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  typingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  typingText: {
    fontSize: 12,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    maxHeight: 120,
    lineHeight: 20,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
