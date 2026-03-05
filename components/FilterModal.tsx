import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/colors';
import { FONT_SIZE } from '@/src/ui/typography';
import { RADIUS, SCREEN_PADDING, SPACING } from '@/src/ui/layout';

interface FilterOption {
  id: string;
  label: string;
  selected: boolean;
}

interface FilterSection {
  id: string;
  title: string;
  options: FilterOption[];
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  sections: FilterSection[];
  onOptionToggle: (sectionId: string, optionId: string) => void;
  onApply: () => void;
  onClear: () => void;
}

export default function FilterModal({
  visible,
  onClose,
  sections,
  onOptionToggle,
  onApply,
  onClear
}: FilterModalProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Filters</Text>
          <TouchableOpacity onPress={onClear}>
            <Text style={[styles.clearText, { color: colors.primary }]}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {sections.map((section) => (
            <View key={section.id} style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
              {section.options.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.option}
                  onPress={() => onOptionToggle(section.id, option.id)}
                >
                  <Text style={[styles.optionText, { color: colors.text }]}>{option.label}</Text>
                  {option.selected && (
                    <Check size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity style={[styles.applyButton, { backgroundColor: colors.primary }]} onPress={onApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
  },
  clearText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    paddingHorizontal: SCREEN_PADDING,
    marginBottom: SPACING.md,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: SPACING.md,
  },
  optionText: {
    fontSize: FONT_SIZE.lg,
  },
  footer: {
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
  },
  applyButton: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: 'white',
  },
});