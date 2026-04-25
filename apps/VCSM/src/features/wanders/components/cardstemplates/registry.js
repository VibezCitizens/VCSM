// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\cardstemplates\registry.js
import { genericMinimalTemplate } from "./generic.minimal";
import { birthdayModernTemplate } from "./birthday.modern";
import { businessProfessionalTemplate } from "./business.professional";

// ❤️ Valentines (lovedrop folder)
import { valentinesRomanticTemplate } from "./lovedrop/valentines.romantic";
import { valentinesBoldTemplate } from "./lovedrop/valentines.bold";
import { valentinesClassicTemplate } from "./lovedrop/valentines.classic";
import { valentinesCuteTemplate } from "./lovedrop/valentines.cute";
import { valentinesMinimalTemplate } from "./lovedrop/valentines.minimal";
import { valentinesPoemTemplate } from "./lovedrop/valentines.poem";

// ✅ NEW: Photo template
import { photoBasicTemplate } from "./photo/photo.basic";
import { mothersDayBasicTemplate } from "./mothersday/mothers_day.basic";
import { mothersDayPremiumTemplate } from "./mothersday/mothers_day.premium";
import { mothersDayVportPromoTemplate } from "./mothersday/mothers_day.vport_promo";

// 🍎 Teacher Appreciation (May 4–8, 2026)
import { teacherAppreciationBasicTemplate } from "./teacherappreciation/teacher_appreciation.basic";
import { teacherAppreciationPremiumTemplate } from "./teacherappreciation/teacher_appreciation.premium";
import { teacherAppreciationClassroomTemplate } from "./teacherappreciation/teacher_appreciation.classroom_thank_you";
import { teacherAppreciationVportPromoTemplate } from "./teacherappreciation/teacher_appreciation.vport_promo";

export const templates = {
  generic: [genericMinimalTemplate],
  birthday: [birthdayModernTemplate],

  valentines: [
    valentinesRomanticTemplate,
    valentinesClassicTemplate,
    valentinesCuteTemplate,
    valentinesMinimalTemplate,
    valentinesPoemTemplate,
    valentinesBoldTemplate,
  ],

  business: [businessProfessionalTemplate],

  // ✅ NEW: enables the "Photo" card type button to show up
  photo: [photoBasicTemplate],

  mothers_day: [
    mothersDayBasicTemplate,
    mothersDayPremiumTemplate,
    mothersDayVportPromoTemplate,
  ],

  teacher_appreciation: [
    teacherAppreciationBasicTemplate,
    teacherAppreciationPremiumTemplate,
    teacherAppreciationClassroomTemplate,
    teacherAppreciationVportPromoTemplate,
  ],
};
