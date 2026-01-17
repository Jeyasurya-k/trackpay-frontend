import React from "react";
import { View, Dimensions } from "react-native";
import { PieChart as RNPieChart } from "react-native-chart-kit";

const PieChart = ({ data }) => {
  const screenWidth = Dimensions.get("window").width;

  const chartConfig = {
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  return (
    <View>
      <RNPieChart
        data={data}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        accessor="value"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </View>
  );
};

export default PieChart;
