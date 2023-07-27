import { HealthDataRequestDto, group } from '@/dtos/users.dto';
import dayjs from 'dayjs';

interface IAggregate {
  value: number;
  date: Date;
  units: {
    unit: string;
  };
}

export function aggregate(data: IAggregate[], group: group) {
  if (!group || group === 'none' || !data.length) return data;

  const formats = {
    day: 'YYYY-MM-DD',
    month: 'YYYY-MM',
    year: 'YYYY',
  };

  const groupedData = {};
  const groupCounts = {};
  data.forEach(entry => {
    const date = dayjs.utc(entry.date);

    const groupDate = date.startOf(group).format(formats[group]);

    if (!groupedData[groupDate]) {
      groupCounts[groupDate] = 0;
      groupedData[groupDate] = {
        date: entry.date,
        value: 0,
        units: {
          unit: entry.units.unit,
        },
      };
    }
    groupedData[groupDate].value += entry.value;
    groupCounts[groupDate] += 1;
  });

  const averagedData = Object.keys(groupedData).map(key => {
    return {
      date: groupedData[key].date,
      value: groupedData[key].value / groupCounts[key],
      units: groupedData[key].units,
    };
  });

  //Sort the data by date
  averagedData.sort((a, b) => {
    const dateA = dayjs.utc(a.date);
    const dateB = dayjs.utc(b.date);
    return dateA.isBefore(dateB) ? -1 : 1;
  });

  return averagedData;
}

export function backfillData(data: IAggregate[], request: HealthDataRequestDto, unit: string) {
  if (request.group === 'none') return data;

  const group = request.group as any;
  let currentDate = dayjs.utc(request.from, 'YYYYMMDD').startOf(group);
  const endDateObj = request.to ? dayjs.utc(request.to, 'YYYYMMDD').startOf(group) : dayjs.utc().startOf(group);

  const filledData = [];

  data.forEach(datum => {
    const datumDate = dayjs.utc(datum.date).startOf(group);

    while (currentDate.isBefore(datumDate, group) && currentDate.isBefore(endDateObj)) {
      filledData.push({
        date: currentDate.toDate(),
        value: null,
        units: {
          unit: unit,
        },
      });
      currentDate = currentDate.add(1, group);
    }

    if (currentDate.isSame(datumDate, group)) {
      filledData.push(datum);
      currentDate = currentDate.add(1, group);
    }
  });

  while (currentDate.isBefore(endDateObj) || currentDate.isSame(endDateObj, group)) {
    filledData.push({ date: currentDate.toDate(), value: null, units: { unit: unit } });
    currentDate = currentDate.add(1, group);
  }

  return filledData;
}
