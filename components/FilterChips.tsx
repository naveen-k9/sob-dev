import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';

interface FilterChip {
  id: string;
  label: string;
  selected: boolean;
}

interface FilterChipsProps {
  filters: FilterChip[];
  onFilterToggle: (filterId: string) => void;
  onClearAll: () => void;
}

export default function FilterChips({ filters, onFilterToggle, onClearAll }: FilterChipsProps) {
  const selectedCount = filters.filter(f => f.selected).length;

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {selectedCount > 0 && (
          <TouchableOpacity style={styles.clearAllChip} onPress={onClearAll}>
            <X size={14} color="#48479B" />
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
        
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.chip,
              filter.selected && styles.selectedChip
            ]}
            onPress={() => onFilterToggle(filter.id)}
          >
            <Text style={[
              styles.chipText,
              filter.selected && styles.selectedChipText
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  chip: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedChip: {
    backgroundColor: '#48479B',
    borderColor: '#48479B',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedChipText: {
    color: 'white',
  },
  clearAllChip: {
    backgroundColor: '#FFF5F2',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#48479B',
  },
  clearAllText: {
    fontSize: 14,
    color: '#48479B',
    fontWeight: '500',
    marginLeft: 4,
  },
});