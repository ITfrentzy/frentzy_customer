import { ThemedText } from "@/components/ThemedText";
import { buildMarkedDates, isBefore, to12HourFormat } from "@/utils/date";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";

type Props = {
  visible: boolean;
  initialStart: string | null;
  initialEnd: string | null;
  initialPickupTime?: string;
  initialDropoffTime?: string;
  minDate: string;
  onClose: () => void;
  onConfirm: (
    start: string,
    end: string,
    pickupTime: string,
    dropoffTime: string
  ) => void;
};

export function DateRangePickerModal({
  visible,
  initialStart,
  initialEnd,
  initialPickupTime = "10:00",
  initialDropoffTime = "10:00",
  minDate,
  onClose,
  onConfirm,
}: Props) {
  const [tempStart, setTempStart] = useState<string | null>(initialStart);
  const [tempEnd, setTempEnd] = useState<string | null>(initialEnd);
  const [pickupTime, setPickupTime] = useState<string>(initialPickupTime);
  const [dropoffTime, setDropoffTime] = useState<string>(initialDropoffTime);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [timePickerMode, setTimePickerMode] = useState<"pickup" | "dropoff">(
    "pickup"
  );

  useEffect(() => {
    if (visible) {
      setTempStart(initialStart);
      setTempEnd(initialEnd);
      setPickupTime(initialPickupTime);
      setDropoffTime(initialDropoffTime);
    }
  }, [
    visible,
    initialStart,
    initialEnd,
    initialPickupTime,
    initialDropoffTime,
  ]);

  const onDayPress = (day: DateData) => {
    const selected = day.dateString;
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(selected);
      setTempEnd(null);
      return;
    }
    if (isBefore(selected, tempStart)) {
      setTempStart(selected);
      setTempEnd(null);
    } else if (selected === tempStart) {
      setTempEnd(selected);
    } else {
      setTempEnd(selected);
    }
  };

  const clearDates = () => {
    setTempStart(null);
    setTempEnd(null);
  };

  const applyDates = () => {
    if (tempStart && tempEnd) {
      onConfirm(tempStart, tempEnd, pickupTime, dropoffTime);
    }
  };

  const onOpenTimePicker = (mode: "pickup" | "dropoff") => {
    setTimePickerMode(mode);
    setShowTimePicker(true);
  };

  const markedDates = buildMarkedDates(tempStart, tempEnd);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText type="title">Select dates & times</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <Calendar
          style={{ alignSelf: "stretch" }}
          current={tempStart ?? minDate}
          minDate={minDate}
          onDayPress={onDayPress}
          markedDates={markedDates}
          markingType="period"
          enableSwipeMonths
          hideExtraDays={false}
          showSixWeeks
          theme={{
            calendarBackground: "#151718",
            textSectionTitleColor: "#fff",
            monthTextColor: "#fff",
            dayTextColor: "#fff",
            todayTextColor: "#fff",
            selectedDayBackgroundColor: "#fff",
            selectedDayTextColor: "#000",
            arrowColor: "#fff",
            textDisabledColor: "#9BA1A6",
          }}
        />

        {/* Time Selection Section */}
        <View style={styles.timeSection}>
          <ThemedText style={[styles.timeSectionTitle, { color: "#fff" }]}>Time</ThemedText>
          <View style={styles.timeContainer}>
            <TouchableOpacity
              style={styles.timeInput}
              onPress={() => onOpenTimePicker("pickup")}
              activeOpacity={0.8}
            >
              <ThemedText style={[styles.timeLabel, { color: "#9BA1A6" }]}>Pickup</ThemedText>
              <ThemedText style={[styles.timeValue, { color: "#fff" }]}>
                {to12HourFormat(pickupTime)}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.timeInput}
              onPress={() => onOpenTimePicker("dropoff")}
              activeOpacity={0.8}
            >
              <ThemedText style={[styles.timeLabel, { color: "#9BA1A6" }]}>Dropoff</ThemedText>
              <ThemedText style={[styles.timeValue, { color: "#fff" }]}>
                {to12HourFormat(dropoffTime)}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity onPress={clearDates} style={styles.clearButton}>
            <ThemedText style={styles.clearButtonText}>Clear</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={applyDates}
            style={[
              styles.applyButton,
              (!tempStart || !tempEnd) && { backgroundColor: "rgba(255,255,255,0.3)" },
            ]}
            disabled={!tempStart || !tempEnd}
          >
            <ThemedText
              style={[
                styles.applyButtonText,
                (!tempStart || !tempEnd) && { color: "rgba(0,0,0,0.6)" },
              ]}
            >
              Confirm
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.timePickerOverlay}>
          <View style={[styles.timePickerContainer, { backgroundColor: "#151718" }]}>
            <View style={styles.timePickerHeader}>
              <ThemedText style={[styles.timePickerTitle, { color: "#fff" }]}>
                {timePickerMode === "pickup" ? "Pickup Time" : "Dropoff Time"}
              </ThemedText>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.timePickerContent}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.timePickerScrollView}
              >
                {/* Early Morning Section */}
                <View style={styles.timeSection}>
                  <ThemedText style={[styles.timeSectionHeader, { color: "#fff" }]}>
                    Early Morning
                  </ThemedText>
                  <View style={styles.timeOptionsContainer}>
                    {[
                      "00:00",
                      "00:30",
                      "01:00",
                      "01:30",
                      "02:00",
                      "02:30",
                      "03:00",
                      "03:30",
                      "04:00",
                      "04:30",
                      "05:00",
                      "05:30",
                      "06:00",
                      "06:30",
                      "07:00",
                      "07:30",
                    ].map((time) => {
                      const isSelected =
                        timePickerMode === "pickup"
                          ? time === pickupTime
                          : time === dropoffTime;
                      return (
                        <TouchableOpacity
                          key={time}
                          style={[
                            styles.timeOption,
                            isSelected && styles.timeOptionSelected,
                          ]}
                          onPress={() => {
                            if (timePickerMode === "pickup") {
                              setPickupTime(time);
                            } else {
                              setDropoffTime(time);
                            }
                            setShowTimePicker(false);
                          }}
                        >
                          <ThemedText
                            style={[
                              styles.timeOptionText,
                              isSelected && styles.timeOptionTextSelected,
                            ]}
                          >
                            {to12HourFormat(time)}
                          </ThemedText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Morning-Afternoon Section */}
                <View style={styles.timeSection}>
                  <ThemedText style={[styles.timeSectionHeader, { color: "#fff" }]}>
                    Morning - Afternoon
                  </ThemedText>
                  <View style={styles.timeOptionsContainer}>
                    {[
                      "08:00",
                      "08:30",
                      "09:00",
                      "09:30",
                      "10:00",
                      "10:30",
                      "11:00",
                      "11:30",
                      "12:00",
                      "12:30",
                      "13:00",
                      "13:30",
                      "14:00",
                      "14:30",
                      "15:00",
                      "15:30",
                      "16:00",
                      "16:30",
                      "17:00",
                      "17:30",
                    ].map((time) => {
                      const isSelected =
                        timePickerMode === "pickup"
                          ? time === pickupTime
                          : time === dropoffTime;
                      return (
                        <TouchableOpacity
                          key={time}
                          style={[
                            styles.timeOption,
                            isSelected && styles.timeOptionSelected,
                          ]}
                          onPress={() => {
                            if (timePickerMode === "pickup") {
                              setPickupTime(time);
                            } else {
                              setDropoffTime(time);
                            }
                            setShowTimePicker(false);
                          }}
                        >
                          <ThemedText
                            style={[
                              styles.timeOptionText,
                              isSelected && styles.timeOptionTextSelected,
                            ]}
                          >
                            {to12HourFormat(time)}
                          </ThemedText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Evening Section */}
                <View style={styles.timeSection}>
                  <ThemedText style={[styles.timeSectionHeader, { color: "#fff" }]}>
                    Evening
                  </ThemedText>
                  <View style={styles.timeOptionsContainer}>
                    {[
                      "17:30",
                      "18:00",
                      "18:30",
                      "19:00",
                      "19:30",
                      "20:00",
                      "20:30",
                      "21:00",
                      "21:30",
                      "22:00",
                      "22:30",
                      "23:00",
                      "23:30",
                    ].map((time) => {
                      const isSelected =
                        timePickerMode === "pickup"
                          ? time === pickupTime
                          : time === dropoffTime;
                      return (
                        <TouchableOpacity
                          key={time}
                          style={[
                            styles.timeOption,
                            isSelected && styles.timeOptionSelected,
                          ]}
                          onPress={() => {
                            if (timePickerMode === "pickup") {
                              setPickupTime(time);
                            } else {
                              setDropoffTime(time);
                            }
                            setShowTimePicker(false);
                          }}
                        >
                          <ThemedText
                            style={[
                              styles.timeOptionText,
                              isSelected && styles.timeOptionTextSelected,
                            ]}
                          >
                            {to12HourFormat(time)}
                          </ThemedText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#151718",
  },
  modalHeader: {
    paddingTop: Platform.OS === "ios" ? 56 : 24,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  timeSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  timeInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(230, 232, 235, 0.14)",
  },
  timeLabel: {
    fontSize: 12,
    color: "#687076",
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
  },
  modalActions: {
    padding: 16,
    flexDirection: "row",
    gap: 12,
  },
  clearButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fff",
    alignItems: "center",
    paddingVertical: 12,
  },
  clearButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  applyButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 12,
  },
  applyButtonText: {
    color: "#000",
    fontWeight: "600",
  },
  timePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  timePickerContainer: {
    backgroundColor: "#151718",
    borderRadius: 12,
    width: "95%",
    height: "85%",
  },
  timePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#11181C",
  },
  timePickerContent: {
    flex: 1,
    padding: 16,
  },
  timePickerScrollView: {
    flex: 1,
  },
  timeOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  timeOption: {
    width: "48%",
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(230, 232, 235, 0.14)",
  },
  timeOptionSelected: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  timeOptionText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "500",
  },
  timeOptionTextSelected: {
    color: "#000",
    fontWeight: "600",
  },
  timeSectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
});
