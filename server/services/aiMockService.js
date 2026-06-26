function getNigerianMockResponse(
  message,
  patientName = 'there',
  history = [],
  medicalHistory = '',
  prescriptions = ''
) {
  const msg = message.toLowerCase().trim();
  const name = patientName.split(' ')[0];

  const aiTurnCount = history.filter((h) =>
    h.role === 'ai' || h.role === 'assistant'
  ).length;

  const allAIMessages = history
    .filter((h) => h.role === 'ai' || h.role === 'assistant')
    .map((h) => h.content || h.text || '');

  const alreadyAsked = (keyword) =>
    allAIMessages.some((m) => m.toLowerCase().includes(keyword));

  const allPatientMessages = history
    .filter((h) => h.role === 'user')
    .map((h) => h.content || h.text || '');

  const patientSaid = (keyword) =>
    allPatientMessages.some((m) => m.toLowerCase().includes(keyword));

  // Emergency detection — always check regardless of turn
  if (msg.includes('chest pain') ||
      (msg.includes('chest') && msg.includes('breath'))) {
    return `${name}, I am very concerned about what you have ` +
      `described. Chest pain with breathing difficulty can be ` +
      `a sign of a serious condition. Please call 112 immediately ` +
      `or go to your nearest hospital emergency room right now. ` +
      `Do not wait. Are you with someone who can help you?`;
  }

  if (msg.includes('stroke') ||
      (msg.includes('face') && msg.includes('dropp')) ||
      (msg.includes('arm') && msg.includes('weak'))) {
    return `${name}, these symptoms could indicate a stroke. ` +
      `This is a medical emergency. Please call 112 immediately. ` +
      `Every minute matters with a stroke. Is someone with you?`;
  }

  const isGreeting = /\b(hello|hi|hey|good morning|good evening|good afternoon)\b/i.test(msg);

  // ── TURN 0: First message (greeting/opening) ──
  if (aiTurnCount === 0) {
    if (isGreeting) {
      return `Hello ${name}! I am VirtualAI, your personal health ` +
        `assistant on Virtualcare Nigeria. I am here to listen ` +
        `and support you today. How are you feeling?`;
    }
    return `Thank you for reaching out, ${name}. I am sorry to ` +
      `hear you are not feeling well. You mentioned "${message}" — ` +
      `I want to make sure I understand fully. ` +
      `How long have you been experiencing this?`;
  }

  // ── TURN 1: Patient answered duration question ──
  if (aiTurnCount === 1) {
    if (!alreadyAsked('severe') && !alreadyAsked('scale')) {
      return `I understand, ${name}. Thank you for telling me that. ` +
        `How would you describe the severity — is it mild, moderate, ` +
        `or quite severe?`;
    }
  }

  // ── TURN 2: Patient described severity ──
  if (aiTurnCount === 2) {
    if (!alreadyAsked('other symptom') && !alreadyAsked('alongside') &&
        !alreadyAsked('also experienc')) {
      return `I hear you, ${name}. Thank you for being so clear. ` +
        `Are you experiencing any other symptoms alongside this — ` +
        `for example, fever, headache, fatigue, or nausea?`;
    }
  }

  // ── TURN 3: Patient listed other symptoms ──
  if (aiTurnCount === 3) {
    const hasMedHistory = medicalHistory &&
      medicalHistory.length > 5 &&
      medicalHistory !== 'No recorded history' &&
      medicalHistory !== 'None recorded';

    if (!alreadyAsked('medication') && !alreadyAsked('taking any')) {
      const historyNote = hasMedHistory
        ? `I can also see from your medical records that you have ` +
          `a history of ${medicalHistory}. `
        : '';
      return `Thank you ${name}, this is very helpful. ${historyNote}` +
        `Are you currently taking any medication or have you taken ` +
        `anything for this condition so far?`;
    }
  }

  // ── TURN 4: Patient answered about medication ──
  if (aiTurnCount === 4) {
    if (!alreadyAsked('doctor') && !alreadyAsked('specialist')) {
      const firstMsg = allPatientMessages[0]?.toLowerCase() || '';

      let condition = 'general health concern';
      let specialist = 'General Practice';
      let doctorName = 'Dr. Ibrahim Musa';

      if (firstMsg.includes('fever') || firstMsg.includes('temperature') ||
          firstMsg.includes('malaria') || patientSaid('headache') ||
          patientSaid('body ache') || patientSaid('chills')) {
        condition = 'possible malaria or viral infection';
        specialist = 'General Practice';
        doctorName = 'Dr. Ibrahim Musa';
      } else if (firstMsg.includes('chest') || firstMsg.includes('heart')) {
        condition = 'cardiac concern';
        specialist = 'Cardiology';
        doctorName = 'Dr. Chukwuemeka Okonkwo';
      } else if (firstMsg.includes('headache') || firstMsg.includes('head')) {
        condition = 'recurring headaches — possibly tension or migraine';
        specialist = 'Neurology';
        doctorName = 'Dr. Babatunde Fashola';
      } else if (firstMsg.includes('skin') || firstMsg.includes('rash') ||
                 firstMsg.includes('itch')) {
        condition = 'skin condition';
        specialist = 'Dermatology';
        doctorName = 'Dr. Adaeze Nwosu';
      } else if (firstMsg.includes('stomach') || firstMsg.includes('belly') ||
                 firstMsg.includes('abdomen') || firstMsg.includes('belle')) {
        condition = 'gastrointestinal concern';
        specialist = 'Gastroenterology';
        doctorName = 'Dr. Ibrahim Musa';
      } else if (firstMsg.includes('depress') || firstMsg.includes('anxious') ||
                 firstMsg.includes('stress') || firstMsg.includes('mental')) {
        condition = 'mental health concern';
        specialist = 'Psychiatry';
        doctorName = 'Dr. Oluwaseun Adeleke';
      } else if (firstMsg.includes('pregnan') || firstMsg.includes('period') ||
                 firstMsg.includes('fibroid') || firstMsg.includes('womb')) {
        condition = 'gynaecological concern';
        specialist = 'Gynecology';
        doctorName = 'Dr. Fatima Al-Amin';
      } else if (firstMsg.includes('child') || firstMsg.includes('baby') ||
                 firstMsg.includes('kid') || firstMsg.includes('infant')) {
        condition = 'paediatric concern';
        specialist = 'Pediatrics';
        doctorName = 'Dr. Chioma Eze';
      }

      return `Thank you so much for sharing all of this with me, ` +
        `${name}. Based on everything you have described, this sounds ` +
        `like it could be a ${condition}. I want to make sure you ` +
        `get the proper care you deserve. I would recommend you ` +
        `speak with a ${specialist} specialist. On Virtualcare, ` +
        `${doctorName} is available and highly rated by Nigerian ` +
        `patients. Would you like me to help you book an appointment?`;
    }
  }

  // ── TURN 5+: Booking confirmation or follow-up ──
  if (aiTurnCount >= 5) {
    if (msg.includes('yes') || msg.includes('sure') ||
        msg.includes('please') || msg.includes('ok') ||
        msg.includes('book')) {
      return `Wonderful, ${name}! I am so glad you are taking ` +
        `this step for your health. Click the "Book" button in ` +
        `your sidebar and I have pre-selected the most suitable ` +
        `specialist for your condition. As a returning patient, ` +
        `you will also get your 25% discount applied automatically. ` +
        `Is there anything else you would like to ask me before ` +
        `you book?`;
    }

    if (msg.includes('no') || msg.includes('not now') ||
        msg.includes('later')) {
      return `That is completely okay, ${name}. I am always here ` +
        `whenever you are ready. Please do not ignore your symptoms ` +
        `for too long — early care always leads to better outcomes. ` +
        `Take care of yourself, and do not hesitate to come back ` +
        `anytime you need support. 💙`;
    }

    if (msg.includes('thank') || msg.includes('bye') ||
        msg.includes('okay')) {
      return `You are very welcome, ${name}. It was my pleasure ` +
        `to assist you today. Remember, your health is your greatest ` +
        `wealth. Virtualcare is here for you 24/7. Take care! 💙`;
    }

    return `I understand, ${name}. Is there anything specific ` +
      `about your condition or the booking process that I can ` +
      `help you with?`;
  }

  // Default fallback — never repeat, always move forward
  const fallbacks = [
    `Thank you for that, ${name}. Could you tell me a little ` +
      `more about how this is affecting your daily life?`,
    `I appreciate you sharing that with me, ${name}. ` +
      `What worries you most about your current situation?`,
    `I understand, ${name}. On a scale of 1 to 10, ` +
      `how much is this affecting your quality of life right now?`,
    `Thank you ${name}. Have you noticed anything that makes ` +
      `your symptoms better or worse?`,
    `I hear you, ${name}. Is there any family history of this ` +
      `condition that you are aware of?`
  ];

  const unusedFallback = fallbacks.find((f) =>
    !allAIMessages.some((m) => m.includes(f.substring(20, 50)))
  );

  return unusedFallback ||
    `Thank you for all the information, ${name}. Based on ` +
    `everything you have shared, I recommend booking with one ` +
    `of our MDCN-certified doctors on Virtualcare for a proper ` +
    `diagnosis. Would you like help booking now?`;
}

module.exports = { getNigerianMockResponse };
