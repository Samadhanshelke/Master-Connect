import { ThemedText } from '@/components/themed-text';
import { Avatar, Button, Divider, IconButton } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  deleteChatMessage,
  reportChatMessage,
  sendChatMessage,
  subscribeToMessages,
  voteOnPoll,
} from '@/services/chat';
import { pickDocument, pickImages, uploadFile } from '@/services/media';
import { ChatMessageRecord } from '@/types/chat';
import { formatMessageTime } from '@/utils/time';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

type MessageAttachment = {
  type: 'image' | 'poll' | 'document';
  url?: string;
  fileName?: string;
  pollOptions?: { text: string; votes: number }[];
};

type Message = {
  id: string;
  authorId?: string;
  user: string;
  text: string;
  time: string;
  isMe: boolean;
  attachment?: MessageAttachment;
};

function toUiMessage(record: ChatMessageRecord, uid?: string): Message {
  return {
    id: record.id,
    authorId: record.authorId,
    user: record.authorName,
    text: record.text,
    time: formatMessageTime(record.createdAt),
    isMe: record.authorId === uid,
    attachment: record.attachment
      ? {
          type: record.attachment.type,
          url: record.attachment.url,
          fileName: record.attachment.fileName,
          pollOptions: record.attachment.pollOptions?.map((option) => ({
            text: option.text,
            votes: option.votes,
          })),
        }
      : undefined,
  };
}

type ChatConversationProps = {
  roomId: string;
  title: string;
  showBack?: boolean;
  onBack?: () => void;
};

export function ChatConversation({ roomId, title, showBack = false, onBack }: ChatConversationProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const scrollViewRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToMessages(
      roomId,
      (records) => {
        setMessages(records.map((record) => toUiMessage(record, user?.uid)));
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      (error) => {
        console.error('Error loading messages:', error);
      },
    );

    return unsubscribe;
  }, [roomId, user?.uid]);

  const displayName = profile?.name || user?.email?.split('@')[0] || 'You';

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !roomId || !user) return;

    try {
      const text = newMessage.trim();
      setNewMessage('');
      await sendChatMessage({
        roomId,
        authorId: user.uid,
        authorName: displayName,
        text,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      Toast.show({ type: 'error', text1: 'Could not send message' });
    }
  };

  const handleSendImage = async () => {
    if (!roomId || !user) return;
    setShowAttachmentMenu(false);
    try {
      const files = await pickImages(1);
      if (files.length === 0) return;
      const url = await uploadFile(user.uid, files[0], 'chat');
      await sendChatMessage({
        roomId,
        authorId: user.uid,
        authorName: displayName,
        text: '',
        attachment: { type: 'image', url },
      });
      Toast.show({ type: 'success', text1: 'Image sent!' });
    } catch (error) {
      console.error('Error sending image:', error);
      Toast.show({
        type: 'error',
        text1: error instanceof Error ? error.message : 'Could not send image',
      });
    }
  };

  const handleSendDocument = async () => {
    if (!roomId || !user) return;
    setShowAttachmentMenu(false);
    try {
      const file = await pickDocument();
      if (!file) return;
      const url = await uploadFile(user.uid, file, 'chat');
      await sendChatMessage({
        roomId,
        authorId: user.uid,
        authorName: displayName,
        text: '',
        attachment: { type: 'document', fileName: file.name, url },
      });
      Toast.show({ type: 'success', text1: 'Document sent!' });
    } catch (error) {
      console.error('Error sending document:', error);
      Toast.show({
        type: 'error',
        text1: error instanceof Error ? error.message : 'Could not send document',
      });
    }
  };

  const handleCreatePoll = async () => {
    if (!pollQuestion.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter a question' });
      return;
    }

    const validOptions = pollOptions.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      Toast.show({ type: 'error', text1: 'Please add at least 2 options' });
      return;
    }

    if (!roomId || !user) return;

    try {
      await sendChatMessage({
        roomId,
        authorId: user.uid,
        authorName: displayName,
        text: pollQuestion.trim(),
        attachment: {
          type: 'poll',
          pollOptions: validOptions.map((opt) => ({ text: opt, votes: 0, votedBy: [] })),
        },
      });
      setShowPollModal(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      Toast.show({ type: 'success', text1: 'Poll created!' });
    } catch (error) {
      console.error('Error creating poll:', error);
      Toast.show({ type: 'error', text1: 'Could not create poll' });
    }
  };

  const handleVotePoll = async (messageId: string, optionIndex: number) => {
    if (!roomId || !user) return;
    try {
      await voteOnPoll(roomId, messageId, optionIndex, user.uid);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'ALREADY_VOTED') {
        Toast.show({ type: 'info', text1: 'You already voted on this poll' });
      } else {
        console.error('Error voting on poll:', error);
        Toast.show({ type: 'error', text1: 'Could not vote' });
      }
    }
  };

  const addPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const next = [...pollOptions];
    next[index] = value;
    setPollOptions(next);
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handleLongPressMessage = (message: Message) => {
    if (message.user !== 'System') {
      setSelectedMessage(message);
      setShowMessageOptions(true);
    }
  };

  const handleReportMessage = async () => {
    if (!selectedMessage || !roomId || !user) return;
    try {
      await reportChatMessage(roomId, selectedMessage.id, user.uid);
      setShowMessageOptions(false);
      setSelectedMessage(null);
      Toast.show({ type: 'success', text1: 'Message reported' });
    } catch (error) {
      console.error('Error reporting message:', error);
      Toast.show({ type: 'error', text1: 'Could not report message' });
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage || !roomId) return;
    try {
      await deleteChatMessage(roomId, selectedMessage.id);
      setShowMessageOptions(false);
      setSelectedMessage(null);
      Toast.show({ type: 'success', text1: 'Message deleted' });
    } catch (error) {
      console.error('Error deleting message:', error);
      Toast.show({ type: 'error', text1: 'Could not delete message' });
    }
  };

  const renderAttachment = (attachment: MessageAttachment, messageId: string, isMe: boolean) => {
    switch (attachment.type) {
      case 'image':
        return (
          <Image
            source={{ uri: attachment.url }}
            className="w-[200px] h-[150px] rounded-xl mt-2"
            resizeMode="cover"
          />
        );
      case 'document':
        return (
          <TouchableOpacity
            className="flex-row items-center rounded-lg p-2.5 mt-2 gap-2"
            style={{ backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : theme.surface }}
            onPress={() => attachment.url && Linking.openURL(attachment.url).catch(() => {})}
          >
            <View
              className="w-9 h-9 rounded-md items-center justify-center"
              style={{ backgroundColor: theme.error + '30' }}
            >
              <Ionicons name="document-text" size={18} color={theme.error} />
            </View>
            <View className="flex-1">
              <ThemedText className="text-[13px] font-semibold" style={{ color: isMe ? '#fff' : theme.text }}>
                {attachment.fileName}
              </ThemedText>
              <ThemedText className="text-[11px]" style={{ color: isMe ? 'rgba(255,255,255,0.7)' : theme.textSecondary }}>
                Tap to download
              </ThemedText>
            </View>
          </TouchableOpacity>
        );
      case 'poll': {
        const totalVotes = attachment.pollOptions?.reduce((sum, opt) => sum + opt.votes, 0) || 0;
        return (
          <View className="mt-2">
            {attachment.pollOptions?.map((option, idx) => {
              const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleVotePoll(messageId, idx)}
                  className="rounded-lg p-2.5 mb-1.5 overflow-hidden"
                  style={{ backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : theme.surface }}
                >
                  <View
                    className="absolute left-0 top-0 bottom-0"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: isMe ? 'rgba(255,255,255,0.3)' : theme.primary + '30',
                    }}
                  />
                  <View className="flex-row justify-between">
                    <ThemedText className="text-[13px]" style={{ color: isMe ? '#fff' : theme.text }}>
                      {option.text}
                    </ThemedText>
                    <ThemedText className="text-xs" style={{ color: isMe ? 'rgba(255,255,255,0.7)' : theme.textSecondary }}>
                      {Math.round(percentage)}%
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              );
            })}
            <ThemedText className="text-[11px] mt-0.5" style={{ color: isMe ? 'rgba(255,255,255,0.7)' : theme.textSecondary }}>
              Tap to vote • {totalVotes} votes
            </ThemedText>
          </View>
        );
      }
      default:
        return null;
    }
  };

  const renderMessage = ({ item: message }: { item: Message }) => (
    <TouchableOpacity
      className={`flex-row my-1 px-3 ${message.isMe ? 'justify-end' : 'justify-start'}`}
      onLongPress={() => handleLongPressMessage(message)}
      delayLongPress={500}
      activeOpacity={0.8}
    >
      {!message.isMe && <Avatar name={message.user} size="sm" />}
      <View className={`max-w-[75%] ${message.isMe ? '' : 'ml-2'}`}>
        {!message.isMe && (
          <ThemedText className="text-xs font-semibold mb-0.5" style={{ color: theme.primary }}>
            {message.user}
          </ThemedText>
        )}
        <View
          className={`px-3.5 py-2.5 shadow-sm ${message.isMe ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm'}`}
          style={{ backgroundColor: message.isMe ? theme.primary : theme.surface }}
        >
          {message.text ? (
            <ThemedText className="text-[15px] leading-5" style={{ color: message.isMe ? '#fff' : theme.text }}>
              {message.text}
            </ThemedText>
          ) : null}
          {message.attachment && renderAttachment(message.attachment, message.id, message.isMe)}
        </View>
        <ThemedText
          className={`text-xs mt-0.5 ${message.isMe ? 'text-right' : 'text-left'}`}
          style={{ color: theme.textSecondary }}
        >
          {message.time}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      <View
        className="flex-row items-center justify-between px-4 py-3 border-b"
        style={{ borderBottomColor: theme.border }}
      >
        <View className="flex-row items-center gap-3">
          {showBack ? <IconButton icon="arrow-back" variant="ghost" onPress={onBack} /> : null}
          <View className="flex-row items-center gap-3">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: theme.primary + '20' }}
            >
              <Ionicons name="people" size={20} color={theme.primary} />
            </View>
            <View>
              <ThemedText type="defaultSemiBold">{title}</ThemedText>
              <ThemedText className="text-xs" style={{ color: theme.textSecondary }}>
                City community chat
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={scrollViewRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center py-16 px-8">
              <Ionicons name="chatbubbles-outline" size={48} color={theme.border} />
              <ThemedText className="mt-3" style={{ color: theme.textSecondary }}>
                No messages yet
              </ThemedText>
              <ThemedText className="text-[13px] text-center" style={{ color: theme.textSecondary }}>
                Say hello to start the conversation
              </ThemedText>
            </View>
          }
        />

        {showAttachmentMenu && (
          <View className="border-t p-3" style={{ borderTopColor: theme.border, backgroundColor: theme.surface }}>
            <View className="flex-row justify-around">
              <TouchableOpacity onPress={handleSendImage} className="items-center gap-1.5">
                <View className="w-[50px] h-[50px] rounded-full items-center justify-center" style={{ backgroundColor: theme.success + '20' }}>
                  <Ionicons name="image" size={24} color={theme.success} />
                </View>
                <ThemedText className="text-xs" style={{ color: theme.textSecondary }}>Photo</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowAttachmentMenu(false);
                  setShowPollModal(true);
                }}
                className="items-center gap-1.5"
              >
                <View className="w-[50px] h-[50px] rounded-full items-center justify-center" style={{ backgroundColor: theme.secondary + '20' }}>
                  <Ionicons name="stats-chart" size={24} color={theme.secondary} />
                </View>
                <ThemedText className="text-xs" style={{ color: theme.textSecondary }}>Poll</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSendDocument} className="items-center gap-1.5">
                <View className="w-[50px] h-[50px] rounded-full items-center justify-center" style={{ backgroundColor: theme.error + '20' }}>
                  <Ionicons name="document" size={24} color={theme.error} />
                </View>
                <ThemedText className="text-xs" style={{ color: theme.textSecondary }}>Document</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <SafeAreaView edges={['bottom']} style={{ backgroundColor: theme.background }}>
          <View className="flex-row items-center p-3 border-t gap-2" style={{ borderTopColor: theme.border }}>
            <TouchableOpacity
              onPress={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: showAttachmentMenu ? theme.primary : theme.surface }}
            >
              <Ionicons
                name={showAttachmentMenu ? 'close' : 'add'}
                size={24}
                color={showAttachmentMenu ? '#fff' : theme.textSecondary}
              />
            </TouchableOpacity>
            <View className="flex-1 flex-row items-center rounded-3xl px-4 border" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
              <TextInput
                className="flex-1 py-2.5 text-[15px]"
                style={{ color: theme.text }}
                placeholder="Message..."
                placeholderTextColor={theme.textSecondary}
                value={newMessage}
                onChangeText={setNewMessage}
                onFocus={() => setShowAttachmentMenu(false)}
              />
            </View>
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: newMessage.trim() ? theme.primary : theme.surface }}
            >
              <Ionicons name="send" size={20} color={newMessage.trim() ? '#fff' : theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <Modal visible={showPollModal} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className={`rounded-t-3xl pt-2 ${Platform.OS === 'ios' ? 'pb-8' : 'pb-4'}`} style={{ backgroundColor: theme.background }}>
            <View className="items-center mb-3">
              <View className="w-10 h-1 rounded-full" style={{ backgroundColor: theme.border }} />
            </View>
            <View className="flex-row items-center justify-between px-4 mb-4">
              <ThemedText type="subtitle">Create Poll</ThemedText>
              <IconButton icon="close" variant="ghost" onPress={() => setShowPollModal(false)} />
            </View>
            <Divider spacing={0} />
            <ScrollView className="max-h-[400px] px-4">
              <ThemedText className="font-semibold mt-4 mb-2">Question</ThemedText>
              <TextInput
                className="rounded-xl p-3.5 text-[15px] border"
                style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
                placeholder="Ask a question..."
                placeholderTextColor={theme.textSecondary}
                value={pollQuestion}
                onChangeText={setPollQuestion}
              />
              <ThemedText className="font-semibold mt-5 mb-2">Options</ThemedText>
              {pollOptions.map((option, index) => (
                <View key={index} className="flex-row items-center mb-2 gap-2">
                  <TextInput
                    className="flex-1 rounded-xl p-3.5 text-[15px] border"
                    style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
                    placeholder={`Option ${index + 1}`}
                    placeholderTextColor={theme.textSecondary}
                    value={option}
                    onChangeText={(value) => updatePollOption(index, value)}
                  />
                  {pollOptions.length > 2 && (
                    <TouchableOpacity onPress={() => removePollOption(index)}>
                      <Ionicons name="close-circle" size={24} color={theme.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {pollOptions.length < 5 && (
                <TouchableOpacity onPress={addPollOption} className="flex-row items-center justify-center py-3 gap-1.5">
                  <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
                  <ThemedText className="font-medium" style={{ color: theme.primary }}>Add Option</ThemedText>
                </TouchableOpacity>
              )}
            </ScrollView>
            <View className="px-4 pt-4">
              <Button title="Create Poll" onPress={handleCreatePoll} fullWidth />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showMessageOptions} animationType="fade" transparent onRequestClose={() => setShowMessageOptions(false)}>
        <TouchableOpacity className="flex-1 bg-black/50 justify-end" activeOpacity={1} onPress={() => setShowMessageOptions(false)}>
          <View className="rounded-t-3xl p-4 pb-8" style={{ backgroundColor: theme.background }}>
            <View className="items-center mb-4">
              <View className="w-10 h-1 rounded-full" style={{ backgroundColor: theme.border }} />
            </View>
            {selectedMessage?.isMe ? (
              <TouchableOpacity className="flex-row items-center gap-4 py-4" onPress={handleDeleteMessage}>
                <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: theme.error + '15' }}>
                  <Ionicons name="trash-outline" size={22} color={theme.error} />
                </View>
                <ThemedText className="text-[16px]" style={{ color: theme.error }}>Delete Message</ThemedText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity className="flex-row items-center gap-4 py-4" onPress={handleReportMessage}>
                <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: theme.secondary + '15' }}>
                  <Ionicons name="flag-outline" size={22} color={theme.secondary} />
                </View>
                <ThemedText className="text-[16px]">Report Message</ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="mt-4 py-3 rounded-xl items-center"
              style={{ backgroundColor: theme.surface }}
              onPress={() => setShowMessageOptions(false)}
            >
              <ThemedText className="font-semibold">Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
