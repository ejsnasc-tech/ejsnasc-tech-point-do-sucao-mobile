import React from "react";
import {
  ScrollView,
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  View,
} from "react-native";
import type { Category } from "@/types/product";
import { CATEGORIES, CATEGORY_IMAGES, BRAND_COLOR } from "@/constants/categories";

type Props = {
  selected: Category;
  onSelect: (category: Category) => void;
};

export function CategoryNav({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map((category) => {
        const isSelected = selected === category;
        return (
          <TouchableOpacity
            key={category}
            style={[styles.item, isSelected && styles.itemSelected]}
            onPress={() => onSelect(category)}
          >
            <View style={[styles.imageWrapper, isSelected && styles.imageWrapperSelected]}>
              <Image
                source={{ uri: CATEGORY_IMAGES[category] }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
            <Text
              style={[styles.label, isSelected && styles.labelSelected]}
              numberOfLines={2}
            >
              {category}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  item: {
    alignItems: "center",
    width: 72,
    marginHorizontal: 4,
  },
  itemSelected: {},
  imageWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  imageWrapperSelected: {
    borderColor: BRAND_COLOR,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    color: "#555",
    textAlign: "center",
  },
  labelSelected: {
    color: BRAND_COLOR,
    fontWeight: "600",
  },
});
