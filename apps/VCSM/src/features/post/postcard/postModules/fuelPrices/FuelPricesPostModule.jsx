import React from "react";
import { PostModuleCta } from "@/features/post/postcard/postModules/shared/components/PostModuleCta";
import { PostModuleFrame } from "@/features/post/postcard/postModules/shared/components/PostModuleFrame";
import { PostModuleHeader } from "@/features/post/postcard/postModules/shared/components/PostModuleHeader";
import { FuelGradeColumn } from "@/features/post/postcard/postModules/fuelPrices/FuelGradeColumn";
import { parseFuelPricesPostModule } from "@/features/post/postcard/postModules/fuelPrices/fuelPricesPostModule.model";
import "@/features/post/postcard/postModules/fuelPrices/fuelPricesPostModule.css";

export function FuelPricesPostModule({ text, payload = null, stationRoute }) {
  const { stationName, prices, priceUnit } = parseFuelPricesPostModule(text, payload);

  if (prices.length === 0) return null;

  return (
    <PostModuleFrame className="fuel-module" ariaLabel="Fuel prices pump display">
      <PostModuleHeader
        kicker="Fuel prices"
        title={stationName}
        meta={`Price per ${priceUnit} / all taxes included`}
      />

      <div className="fuel-module-grades">
        {prices.map((grade) => (
          <FuelGradeColumn grade={grade} key={grade.label} />
        ))}
      </div>

      <PostModuleCta to={stationRoute}>View station</PostModuleCta>
    </PostModuleFrame>
  );
}
