import { useRef } from 'react';
import { useMount, useUpdate } from 'ahooks';
import { Input, Select, DatePicker, Button } from 'antd';
import dayjs from 'dayjs';
import json2md from 'json2md';
import * as browserUtils from '../../utils/chromeUtils';
import instance from '../../utils/axiosUtils';
const { RangePicker } = DatePicker;
const PageMain = () => {
  // 自定义hooks
  const update = useUpdate();
  // 存储数据的h容器
  const currData = useRef({})

  /**
   * @description 初始化数据
   */
  useMount(() => {
    getInitData()
  })

  const getCurrWeekStart = () => {
    return dayjs(dayjs().startOf('week').add(1, 'day'), 'YYYY-MM-DD')
  }

  const getCurrWeekEnd = () => {
    return dayjs(dayjs().endOf('week').add(1, 'day'), 'YYYY-MM-DD')
  }

  /**
   * @description 获取初始化数据
   */
  const getInitData = async () => {
    // 获取缓存数据 
    const cacheData = await browserUtils.storage.get();
    // 获取当前网站的localStorage
    currData.current = cacheData;
    // 获取表头数据
    currData.current.tableHeaderData = await getTableHeaderData();
    // 获取当前周的开始和结束时间
    currData.current.weeklyReportDate = [getCurrWeekStart(), getCurrWeekEnd()]
    // 更新界面
    update();
  }

  /**
   * @description 获取表头数据
   */
  const getTableHeaderData = async () => {
    const res = await instance(
      {
        url: 'https://www.yuque.com/api/modules/table/doc/TableController/show',
        method: 'get',
        params: {
          docType: "Doc",
          docId: currData.current.docId,
          sheetId: currData.current.sheetId
        },
      }
    )
    return res?.data?.sheet?.[0]?.columns || []
  }

  /**
   * @description 获取表数据
   */
  const getTableData = async () => {
    const res = await instance(
      {
        url: 'https://www.yuque.com/api/modules/table/doc/TableRecordController/show',
        method: 'get',
        params: {
          limit: 1000,
          offset: 0,
          docType: "Doc",
          docId: currData.current.docId,
          sheetId: currData.current.sheetId
        },
      }
    )
    return res?.data?.records.map((itme) => {
      return JSON.parse(itme.data)
    })
  }

  /**
   * @description 设置数据
   */
  const valueOnChange = ({ key, value }) => {
    if (['docId', 'sheetId'].includes(key)) {
      value = value.target.value
    }
    // 更新当前界面数据
    currData.current[key] = value
    // 存储数据
    browserUtils.storage.set(key, value)
    // 刷新界面
    update()
  }

  /**
   * @description 设置任务类型选项
   * @returns 
   */
  const setTaskTypeOptions = () => {
    // 获取表头数据
    const { tableHeaderData = [] } = currData?.current || {}
    // 获取任务类型
    return tableHeaderData.filter(item => ['select', 'multiSelect'].includes(item.type)) || []
    // 修正数据
  }
  /**
   * @description 设置迭代版本选项
   */
  const setIterativeVersionOptions = () => {
    // 获取表头数据
    const { tableHeaderData = [] } = currData?.current || {}
    // 获取周报人选项
    return tableHeaderData.find(item => item.name === '迭代版本')?.options || []
  }
  /**
   * @description 设置行数据类型选项
   * @returns 
   */
  const setRowDataTypeOptions = () => {
    // 获取表头数据
    return currData?.current?.tableHeaderData || []
  }

  /**
   * @description 周报人选项
   */
  const setWeeklyReporterOptions = () => {
    // 获取表头数据
    const { tableHeaderData = [] } = currData?.current || {}
    // 获取周报人选项
    return tableHeaderData.find(item => item.name === '经办人')?.options || []
  }

  /**
   * @description 下载md文件
   * @param {*} data 
   * @param {*} fileName 
   */
  const downloadMd = (data = '', fileName) => {
    const blob = new Blob([data], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${fileName}.md`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  /**
   * @description 过滤迭代版本
   */
  const filterByIterativeVersion = (rowData) => {
    // 获取表头数据
    const { tableHeaderData = [], iterativeVersion = [] } = currData.current;
    // 获取迭代版本的key
    const iterativeVersionInfo = tableHeaderData.find(item => item.name === '迭代版本') || {};
    // 获取迭代版本的key
    const iterativeVersionKey = iterativeVersionInfo.id;
    // 获取迭代版本的真实值
    const iterativeVersionValue = rowData[iterativeVersionKey]?.value;
    // 如果迭代版本不存在则不处理
    return iterativeVersion.includes(iterativeVersionValue)
  }
  // 根据时间过滤
  const filterByTime = (item) => {
    const updatedTime = dayjs(item.updatedAt).valueOf();
    const startTime = dayjs(currData.current.weeklyReportDate[0], 'YYYY-MM-DD HH:mm:ss').valueOf();
    const endTime = dayjs(currData.current.weeklyReportDate[1], 'YYYY-MM-DD HH:mm:ss').valueOf();
    return updatedTime >= startTime && updatedTime <= endTime;
  }

  /**
   * @description json转md
   * @param {*} key 
   * @param {*} value 
   * @returns 
   */
  const jsonToMd = (key, value) => {
    // 定义json模版
    const template = {
      h2: '## ',
      h5: '##### ',
      ul: ' - ',
      li: '   - ',
    }
    // 转成md
    return `${template[key]}${value}\n`
  }

  /**
   * @description 创建进度的md
   */
  const createScheduleMd = (rowData) => {
    // 获取表头数据
    const { tableHeaderData = [] } = currData?.current || {}
    // 获取进度的key
    const scheduleInfo = tableHeaderData.find(item => item.name === '进度') || {};
    // 获取进度的key
    const scheduleKey = scheduleInfo.id;
    // 获取进度的options
    const scheduleOptions = scheduleInfo.options || [];
    // 获取进度的真实值
    const scheduleValue = rowData[scheduleKey]?.value;
    // 如果进度不存在则不处理
    if (!scheduleValue) return false;
    // 获取进度的中文名
    const scheduleName = scheduleOptions.find(item => item.id === scheduleValue)?.value;
    // 如果进度是已完成则需要判断时间
    if (scheduleName === '已完成') {
      const flag = filterByTime(rowData)
      if (!flag) return false
      return '已完成'
    } else if (['未开始'].includes(scheduleName)) {
      //未完成的需要走一个过滤
      const flag = filterByIterativeVersion(rowData)
      if (!flag) return false
      return '未开始'
    }
    return scheduleName
  }

  /**
   * @description 创建行数据的md
   * @param {*} rowData 
   */
  const createRowDateMd = (rowData) => {
    const { tableHeaderData = [], rowDataType = [] } = currData?.current || {}
    let mdStr = '';
    rowDataType.forEach((rowId) => {
      // 获取当前行的信息
      const rowInfo = tableHeaderData.find(item => item.id === rowId) || {};
      // 如果是文本则直接拼接
      const rowValue = rowData[rowId]?.value || '';
      if (rowInfo.type === 'select') {
        const rowShowValue = rowInfo.options.find(item => item.id === rowValue)?.value
        mdStr += `${rowShowValue} `;
      }
      if (rowInfo.type === 'text') {
        mdStr += `${rowValue} `;
      }
    })
    // 返回md
    return jsonToMd('li', mdStr)
  }

  /**
   * @description 创建任务类型的md
   * @param {*} rowData 
   */
  const createTaskTypeMd = (rowData) => {
    // 获取表头数据
    const { tableHeaderData = [], taskType } = currData?.current || {}
    // 获取任务类型的key
    const taskTypeInfo = tableHeaderData.find(item => item.id === taskType) || {};
    // 获取任务类型的key
    const taskTypeKey = taskTypeInfo.id;
    // 获取任务类型的options
    const taskTypeOptions = taskTypeInfo.options || [];
    // 获取任务类型的真实值
    const taskTypeValue = rowData[taskTypeKey]?.value;
    // 如果任务类型不存在则不处理
    if (!taskTypeValue) return false;
    // 获取任务类型的中文名
    const taskTypeName = taskTypeOptions.find(item => item.id === taskTypeValue)?.value;
    // 返回md
    return jsonToMd('ul', taskTypeName)
  }

  /**
   * @description 创建经办人的md
   * @param {*} tableData
   * @returns
   */
  const createOperatorMd = (rowData) => {
    // 获取表头数据
    const { tableHeaderData = [], weeklyReporter = [] } = currData?.current || {}
    // 获取经办人的key
    const operatorInfo = tableHeaderData.find(item => item.name === '经办人') || {};
    // 获取经办人的key
    const operatorKey = operatorInfo.id;
    // 获取经办人的options
    const operatorOptions = operatorInfo.options || [];
    // 获取经办人的真实值
    const operatorValue = rowData[operatorKey]?.value;
    // 如果经办人不是周报人则不处理
    if (!weeklyReporter.includes(operatorValue)) return false;
    // 获取经办人的中文名
    const operatorName = operatorOptions.find(item => item.id === operatorValue)?.value;
    // 返回md
    return jsonToMd('h5', operatorName)
  }
  /**
   * @description 创建md类型的表格
   */
  const createMdTableList = (tableList) => {
    const resList = []
    // 遍历每行数据
    tableList.forEach((rowData) => {
      const rowDataList = []
      // 判断经办人是谁
      const operatorMd = createOperatorMd(rowData);
      // 如果操作人md不存在则不处理
      if (!operatorMd) return
      rowDataList.push(operatorMd)
      // 判断任务类型是什么
      const taskTypeMd = createTaskTypeMd(rowData);
      // 如果任务类型md不存在则不处理
      if (!taskTypeMd) return
      // 插入任务类型
      rowDataList.push(taskTypeMd)
      // 判断行数据是什么
      const rowDateMd = createRowDateMd(rowData);
      // 如果行数据md不存在则不处理
      if (!rowDateMd) return
      // 插入行数据
      rowDataList.push(rowDateMd)
      // 判断周报范围日期，只有已经完成的需要判断
      const scheduleRes = createScheduleMd(rowData);
      // 如果进度md不存在则不处理
      if (!scheduleRes) return

      // 如果是进行中，则需要增补到本周工作中
      if (scheduleRes === '进行中') {
        const rowDataListCopy = JSON.parse(JSON.stringify(rowDataList));
        // 创建未开始的md
        const scheduleMd = jsonToMd('h2', '二、下周工作');
        // 头插入
        rowDataListCopy.unshift(scheduleMd)
        // 放到下周工作中
        resList.push(rowDataListCopy)
        // 替换已完成字体
        rowDataList[2] = rowDataList[2].replace('\n', '(进行中)\n')
      }
      if (['未开始'].includes(scheduleRes)) {
        // 创建未开始的md
        const scheduleMd = jsonToMd('h2', '二、下周工作')
        // 头插入
        rowDataList.unshift(scheduleMd)
      } else if (['进行中', '已完成'].includes(scheduleRes)) {
        // 创建已完成的md
        const scheduleMd = jsonToMd('h2', '一、本周工作')
        // 头插入
        rowDataList.unshift(scheduleMd)
      } else {
        return
      }
      // 判断是本周还是下周，已完成的是本周，未完成的是下周，进行中的是本周和下周
      resList.push(rowDataList)
    })
    return resList
  }

  /**
   * @description 重组md表格树
   */
  const recombineMdTable = (tableList) => {
    const loop = (currList) => {
      // 遍历当前列表，将元素相同的放在一起
      const currResList = []
      currList.forEach((item) => {
        const currValue = item.shift();
        const currRes = currResList.find((it) => it.value === currValue)
        if (currRes) {
          currRes.children.push(item)
        } else {
          currResList.push({
            value: currValue,
            children: item.length ? [item] : []
          })
        }

      })
      for (let i = 0; i < currResList.length; i++) {
        const element = currResList[i];
        if (element.children.length > 0) {
          element.children = loop(element.children)
        }
      }

      return currResList
    }
    const resList = loop(tableList);
    if (resList[0].value !== '## 一、本周工作\n') {
      // 如果第一个不是本周工作则交换
      const temp = resList[0];
      resList[0] = resList[1];
      resList[1] = temp;
    }
    return resList
  }

  /**
   * @description 组合mdJSON
   */
  const combineMdJson = (strTree) => {
    let mdJson = '';
    const loop = (currTree) => {
      currTree.forEach((item) => {
        mdJson += item.value;
        if (item.children.length > 0) {
          loop(item.children)
        }
      })
    }
    loop(strTree)
    return mdJson
  }
  /**
   * @description 生成md
   */
  const createMd = async () => {
    // 获取表全量数据
    let tableList = await getTableData();
    // 创建md表格数据
    const mdTableList = createMdTableList(tableList);
    // 重组md表格数据
    const recombineMdTableList = recombineMdTable(mdTableList);
    // 组合mdJson
    const mdJson = combineMdJson(recombineMdTableList);
    // 下载md
    downloadMd(mdJson, '周报')
  }
  return (<div className='page-main'>
    <div className="page-main-top">语雀周报生成器</div>
    <div className="page-main-middle">
      <div className='page-main-middle-row'>
        <div className='page-main-middle-row-title'>docId:</div>
        <div className='page-main-middle-row-value'>
          <Input
            value={currData.current.docId}
            onChange={(value) => { valueOnChange({ key: "docId", value }) }} />
        </div>
      </div>
      <div className='page-main-middle-row'>
        <div className='page-main-middle-row-title'>sheetId:</div>
        <div className='page-main-middle-row-value'>
          <Input
            value={currData.current.sheetId}
            onChange={(value) => { valueOnChange({ key: "sheetId", value }) }} />
        </div>
      </div>
      <div className='page-main-middle-row'>
        <div className='page-main-middle-row-title'>任务类型:</div>
        <div className='page-main-middle-row-value'>
          <Select
            width="300px"
            fieldNames={{ label: 'name', value: 'id', key: 'id', options: 'options123' }}
            value={currData.current.taskType}
            options={setTaskTypeOptions()}
            onChange={(value) => { valueOnChange({ key: "taskType", value }) }}
          />
        </div>
      </div>
      <div className='page-main-middle-row'>
        <div className='page-main-middle-row-title'>行数据类型:</div>
        <div className='page-main-middle-row-value'>
          <Select
            mode="multiple"
            width="300px"
            options={setRowDataTypeOptions()}
            value={currData.current.rowDataType}
            fieldNames={{ label: 'name', value: 'id', key: 'id', options: 'options123' }}
            onChange={(value) => { valueOnChange({ key: "rowDataType", value }) }}
          />
        </div>
      </div>
      <div className='page-main-middle-row'>
        <div className='page-main-middle-row-title'>周报人:</div>
        <div className='page-main-middle-row-value'>
          <Select
            mode="multiple"
            width="300px"
            value={currData.current.weeklyReporter}
            options={setWeeklyReporterOptions()}
            fieldNames={{ label: 'value', value: 'id', key: 'id', options: 'options123' }}
            onChange={(value) => { valueOnChange({ key: "weeklyReporter", value }) }}
          />
        </div>
      </div>
      <div className='page-main-middle-row'>
        <div className='page-main-middle-row-title'>周报日期:</div>
        <div className='page-main-middle-row-value'>
          <RangePicker

            value={currData.current.weeklyReportDate}
            onChange={(value) => { valueOnChange({ key: "weeklyReportDate", value }) }}
          />
        </div>
      </div>
      <div className='page-main-middle-row'>
        <div className='page-main-middle-row-title'>下周工作范围:</div>
        <div className='page-main-middle-row-value'>
          <Select
            mode="multiple"
            width="300px"
            options={setIterativeVersionOptions()}
            value={currData.current.iterativeVersion}
            fieldNames={{ label: 'value', value: 'id', key: 'id', options: 'options123' }}
            onChange={(value) => { valueOnChange({ key: "iterativeVersion", value }) }}
          />
        </div>
      </div>
    </div>
    <div className='page-main-bottom'>
      <Button onClick={createMd}>生成周报</Button>
    </div>

  </div>)
}
export default PageMain;