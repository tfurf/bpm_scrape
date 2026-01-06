# OCR Testing Documentation

## Overview
This document describes the OCR functionality and testing results for blood pressure monitor image recognition.

## OCR Pattern Recognition

The app uses Tesseract.js to extract text from blood pressure monitor images and then applies pattern matching to identify the readings.

### Supported Patterns

1. **Standard Format**: `120/80` or `120 / 80`
   - Extracts systolic and diastolic from slash-separated format

2. **Labeled Format**: `SYS 135 DIA 85 PULSE 68`
   - Looks for labels followed by numbers
   - Supports variations: SYS, SYSTOLIC, DIA, DIASTOLIC

3. **With Units**: `SYS 135 mmHg DIA 85 mmHg PULSE 68 /min`
   - Handles common unit indicators (mmHg, /min, BPM)

4. **Pulse Indicators**: 
   - `PULSE 72`, `HR 72`, `BPM 72`, `72 /min`, `HEART RATE 72`

5. **Fallback Pattern**:
   - If SYS and DIA are found but no pulse label, extracts the third number as pulse
   - Validates it's within pulse range (30-220 bpm)

## Validation Ranges

- **Systolic**: 60-250 mmHg
- **Diastolic**: 40-150 mmHg  
- **Pulse**: 30-220 bpm

Values outside these ranges are rejected.

## Test Results

### Test Cases Passed:

✅ `120/80 PULSE 72` → Systolic: 120, Diastolic: 80, Pulse: 72
✅ `SYS 135 DIA 85 PULSE 68` → Systolic: 135, Diastolic: 85, Pulse: 68
✅ `Systolic: 142 Diastolic: 90 HR: 75` → Systolic: 142, Diastolic: 90, Pulse: 75
✅ `SYS 135 mmHg DIA 85 mmHg PULSE 68 /min` → Systolic: 135, Diastolic: 85, Pulse: 68
✅ Multi-line format with labels on separate lines

### Improvements Made for Test Image:

1. **Better pattern matching** for label-followed-by-number format
2. **Fallback detection** for third number when labels are present
3. **More robust pulse patterns** including `/min` and `HEART RATE`
4. **Debug logging** to console for troubleshooting
5. **Whitespace handling** for better text normalization

## Usage with Test Images

When testing with blood pressure monitor photos:

1. Ensure good lighting (no shadows or glare)
2. Capture the display straight-on
3. Keep the monitor in focus
4. Check browser console for OCR debug output
5. Verify extracted values before saving
6. Use "Re-process Image" if first attempt fails

## Known Limitations

- OCR accuracy depends on image quality
- May struggle with:
  - Low contrast displays
  - Unusual fonts or symbols
  - Rotated or skewed images
  - Very small or large text
  
- Always verify extracted values manually before saving

## Console Debug Output

The OCR process logs to console:
- `OCR Text:` - Raw normalized text from Tesseract
- `Found BP pattern:` - Detected blood pressure format
- `Found SYS pattern:` - Detected systolic value
- `Found DIA pattern:` - Detected diastolic value  
- `Found PULSE pattern:` - Detected pulse value
- `Parsed readings:` - Final extracted values

Check browser DevTools console for detailed OCR analysis.
