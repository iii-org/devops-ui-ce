<template>
  <div class="row">
    <div v-for="(localItem, idx) in localList" :key="idx" class="col">
      <w-item
        :ref="'pi' + idx"
        v-model="localValue[idx]"
        :list-data="localItem"
        data-type="number"
      />
    </div>
  </div>
</template>

<script>
import wItem from './components/WheelItem'

export default {
  name: 'DateSelector',
  components: {
    wItem
  },
  props: {
    value: {
      type: String,
      default: ''
    },
    separator: {
      type: String,
      default: '-'
    },
    yearCount: {
      type: Number,
      default: 15
    }
  },
  data() {
    return {
      localList: [],
      localValue: [],
      pickerYearVal: '',
      pickerMonthVal: '',
      currentDate: new Date(),
      monthArr: [
        '01',
        '02',
        '03',
        '04',
        '05',
        '06',
        '07',
        '08',
        '09',
        '10',
        '11',
        '12'
      ]
    }
  },
  watch: {
    localValue: {
      handler(newVal) {
        this.pickerYearVal = newVal[0]
        this.pickerMonthVal = newVal[1]
        this.$emit('update', newVal.join(this.separator))
      },
      deep: true
    },
    pickerYearVal(newVal) {
      if (this.pickerMonthVal === '02') {
        this.localList[2] = this.getDayArray(newVal, this.pickerMonthVal)
      }
    },
    pickerMonthVal(newVal) {
      this.localList[2] = this.getDayArray(this.pickerYearVal, newVal)
    }
  },
  beforeMount() {
    this.initDate()
  },
  methods: {
    initDate() {
      // calc year of date arrays
      this.yearArr = this.getYearArray()
      this.pickerYearVal = `${this.currentDate.getFullYear()}`

      // calc month of date
      const curentMonth = this.currentDate.getMonth() + 1
      const monthVal = `${curentMonth < 10 ? '0' : ''}${curentMonth}`

      // calc day of date
      let dayVal = `${this.currentDate.getDate()}`
      if (Number(dayVal) < 10) dayVal = `0${dayVal}`
      this.dayArr = this.getDayArray(this.currentYear, monthVal)
      this.localList = [
        this.yearArr,
        this.monthArr,
        this.getDayArray(this.pickerYearVal, '01')
      ]
      if (this.value && this.value !== '') {
        this.localValue = this.value.split(this.separator)
        this.pickerYearVal = this.localValue[0]
        this.pickerMonthVal = this.localValue[1]
      } else {
        this.localValue = [this.pickerYearVal, monthVal, dayVal]
      }
    },
    getDayArray(year, month) {
      if (month === '02') {
        if (this.isLeapYear(year)) {
          return this.autoGeneratorDateStrArray(29)
        } else {
          return this.autoGeneratorDateStrArray(28)
        }
      } else if (['01', '03', '05', '07', '08', '10', '12'].includes(month)) {
        return this.autoGeneratorDateStrArray(31)
      } else {
        return this.autoGeneratorDateStrArray(30)
      }
    },
    isLeapYear(y) {
      if (y % 4 === 0 && y % 100 > 0) {
        return true
      } else if (y % 400 === 0) {
        return true
      } else {
        return false
      }
    },
    getYearArray() {
      const startYear = this.currentDate.getFullYear() - this.yearCount
      return this.autoGeneratorArray(this.yearCount * 2, startYear)
    },
    autoGeneratorDateStrArray(length) {
      return Array.from({ length: length }, (v, i) => {
        const d = i + 1
        if (d < 10) {
          return `0${d}`
        } else {
          return `${d}`
        }
      })
    },
    autoGeneratorArray(length, start = 0) {
      if (start === 0) {
        return Array.from({ length: length }, (v, i) => (i + 1).toString())
      } else {
        return Array.from({ length: length }, (v, i) => (start + i).toString())
      }
    },
    confirmFunc() {
      this.choosedVal = `${this.pickerValYear}-${this.pickerValMonth}-${this.pickerValDay}`
      this.valFunc(this.choosedVal)
    },
    handler(type) {
      // change feb month days index
      if (type === 'month') {
        this.pickerValDay = '01'
        if (this.pickerValMonth === '02') {
          if (this.isLeapYear(this.pickerValYear)) {
            if (this.dayArr.length !== 29) {
              this.dayArr = this.autoGeneratorDateStrArray(29)
            }
          } else {
            const dayPickVal = Number(this.pickerValDay)
            if (this.dayArr.length !== 28) {
              if (dayPickVal > 28) {
                this.pickerValDay = `${28}`
              }
              this.dayArr = this.autoGeneratorDateStrArray(28)
            }
          }
        } else {
          this.dayArr = this.getDayArray(this.currentDay, this.pickerValMonth)
        }
      }
    }
  }
}
</script>

<style scoped>
.row {
  display: -webkit-flex;
  display: flex;
  display: -webkit-box;
  display: -moz-box;
  display: -ms-flexbox;
}

.row .col {
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  -webkit-box-flex: 1;
  -moz-box-flex: 1;
}
</style>
